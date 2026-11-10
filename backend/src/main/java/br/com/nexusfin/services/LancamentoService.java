package br.com.nexusfin.services;

import br.com.nexusfin.dto.ResumoFinanceiro;
import br.com.nexusfin.dto.ResumoCategoria;
import br.com.nexusfin.dto.ResumoMensal;
import br.com.nexusfin.models.ContaBancaria;
import br.com.nexusfin.models.Lancamento;
import br.com.nexusfin.repositories.ContaBancariaRepository;
import br.com.nexusfin.repositories.LancamentoRepository;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LancamentoService {

    private static final List<String> BANCOS_PAGAMENTO = List.of(
            "Nubank",
            "Itaú",
            "Banco do Brasil",
            "Bradesco",
            "Santander",
            "Caixa",
            "Inter",
            "C6 Bank");

    private final LancamentoRepository repository;
    private final ContaBancariaRepository contaRepository;
    private final ComprovanteStorageService comprovanteStorage;

    public LancamentoService(
            LancamentoRepository repository,
            ContaBancariaRepository contaRepository,
            ComprovanteStorageService comprovanteStorage) {
        this.repository = repository;
        this.contaRepository = contaRepository;
        this.comprovanteStorage = comprovanteStorage;
    }

    public List<Lancamento> listarTodos() {
        return repository.findAll();
    }

    public Optional<Lancamento> buscarPorId(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public Lancamento salvar(Lancamento lancamento) {
        validar(lancamento);
        lancamento.setIdLancamento(null);
        ContaBancaria conta = buscarConta(lancamento);
        lancamento.setContaBancaria(conta);
        aplicarMovimento(conta, impacto(lancamento));
        ajustarDadosNota(lancamento);
        return repository.save(lancamento);
    }

    @Transactional
    public Lancamento atualizar(Long id, Lancamento dados) {
        validar(dados);
        Lancamento atual = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        ContaBancaria novaConta = buscarConta(dados);

        if (atual.getContaBancaria() != null) {
            aplicarMovimento(atual.getContaBancaria(), impacto(atual).negate());
        }
        aplicarMovimento(novaConta, impacto(dados));

        atual.setContaBancaria(novaConta);
        atual.setDtLancamento(dados.getDtLancamento());
        atual.setVlLancamento(dados.getVlLancamento());
        atual.setCategoria(dados.getCategoria());
        atual.setTipoLancamento(dados.getTipoLancamento());
        atual.setDescricao(dados.getDescricao());
        atual.setIncluirNotaFiscal(dados.isIncluirNotaFiscal());
        atual.setNrNotaFiscal(dados.getNrNotaFiscal());
        atual.setStatusNotaFiscal(dados.getStatusNotaFiscal());
        ajustarDadosNota(atual);
        return repository.save(atual);
    }

    public Lancamento atualizarTipo(Long id, String tipoLancamento) {
        Lancamento lancamento = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        lancamento.setTipoLancamento(tipoLancamento);
        validarTipoLancamento(lancamento.getTipoLancamento());
        return repository.save(lancamento);
    }

    public Lancamento atualizarStatusPagamento(Long id, String statusPagamento, String bancoPagamento) {
        Lancamento lancamento = buscarNotaFiscal(id);
        if (statusPagamento == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o status do pagamento.");
        }
        String normalizedStatus = statusPagamento.trim().toUpperCase(Locale.ROOT);
        if (!List.of("PENDENTE", "PROCESSADA", "PAGA", "CANCELADA").contains(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status de pagamento inválido.");
        }
        String normalizedBank = normalizePaymentBank(bancoPagamento);
        if ("PAGA".equals(normalizedStatus) && normalizedBank == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Selecione o banco usado para realizar o pagamento.");
        }
        lancamento.setStatusPagamento(normalizedStatus);
        lancamento.setBancoPagamento("PAGA".equals(normalizedStatus) ? normalizedBank : null);
        return repository.save(lancamento);
    }

    public Lancamento anexarComprovante(Long id, MultipartFile file) {
        Lancamento lancamento = buscarNotaFiscal(id);
        if (!"PAGA".equals(lancamento.getStatusPagamento())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Marque a nota como paga antes de anexar o comprovante.");
        }
        if (lancamento.isComprovanteDisponivel()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Esta nota já possui comprovante anexado.");
        }

        ComprovanteStorageService.StoredProof proof = comprovanteStorage.store(file);
        lancamento.setComprovanteArquivo(proof.storedName());
        lancamento.setComprovanteNome(proof.originalName());
        lancamento.setComprovanteTipo(proof.contentType());
        return repository.save(lancamento);
    }

    public ComprovanteDownload obterComprovante(Long id) {
        Lancamento lancamento = buscarNotaFiscal(id);
        if (!lancamento.isComprovanteDisponivel()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Esta nota não possui comprovante.");
        }
        return new ComprovanteDownload(
                comprovanteStorage.locate(lancamento.getComprovanteArquivo()),
                lancamento.getComprovanteNome(),
                lancamento.getComprovanteTipo());
    }

    public Lancamento simularEmissao(Long id) {
        Lancamento lancamento = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!lancamento.isIncluirNotaFiscal()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Este lançamento não foi marcado para nota fiscal.");
        }
        lancamento.setNrNotaFiscal(String.format(Locale.ROOT, "DEMO-%06d", id));
        lancamento.setStatusNotaFiscal("SIMULADA");
        return repository.save(lancamento);
    }

    @Transactional
    public void deletar(Long id) {
        Lancamento lancamento = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (lancamento.getContaBancaria() != null) {
            aplicarMovimento(lancamento.getContaBancaria(), impacto(lancamento).negate());
        }
        repository.delete(lancamento);
    }

    public ResumoFinanceiro resumir(int ano) {
        List<Lancamento> lancamentos = repository.findAll();
        BigDecimal totalReceitas = BigDecimal.ZERO;
        BigDecimal totalDespesas = BigDecimal.ZERO;
        BigDecimal[] receitasMensais = zeros();
        BigDecimal[] despesasMensais = zeros();
        Map<String, BigDecimal[]> totaisPorTipo = new LinkedHashMap<>();
        long notasFiscais = 0;

        for (Lancamento lancamento : lancamentos) {
            LocalDate data = lancamento.getDtLancamento();
            if (data == null || data.getYear() != ano || lancamento.getVlLancamento() == null) {
                continue;
            }
            if (lancamento.isIncluirNotaFiscal()) {
                notasFiscais++;
            }

            int mes = data.getMonthValue() - 1;
            BigDecimal valor = lancamento.getVlLancamento();
            String tipo = lancamento.getTipoLancamento();
            if (tipo == null || tipo.isBlank()) {
                tipo = "Outros";
            }
            BigDecimal[] totais = totaisPorTipo.computeIfAbsent(tipo, ignored -> new BigDecimal[] {
                    BigDecimal.ZERO, BigDecimal.ZERO
            });
            if ("RECEITA".equalsIgnoreCase(lancamento.getCategoria())) {
                totalReceitas = totalReceitas.add(valor);
                receitasMensais[mes] = receitasMensais[mes].add(valor);
                totais[0] = totais[0].add(valor);
            } else if ("DESPESA".equalsIgnoreCase(lancamento.getCategoria())) {
                totalDespesas = totalDespesas.add(valor);
                despesasMensais[mes] = despesasMensais[mes].add(valor);
                totais[1] = totais[1].add(valor);
            }
        }

        List<ResumoMensal> mensal = new ArrayList<>();
        for (int mes = 0; mes < 12; mes++) {
            mensal.add(new ResumoMensal(mes + 1, receitasMensais[mes], despesasMensais[mes]));
        }
        List<ResumoCategoria> categorias = totaisPorTipo.entrySet().stream()
                .map(entry -> new ResumoCategoria(
                        entry.getKey(),
                        entry.getValue()[0],
                        entry.getValue()[1],
                        entry.getValue()[0].subtract(entry.getValue()[1])))
                .toList();
        return new ResumoFinanceiro(
                ano,
                totalReceitas,
                totalDespesas,
                totalReceitas.subtract(totalDespesas),
                notasFiscais,
                mensal,
                categorias);
    }

    private BigDecimal[] zeros() {
        BigDecimal[] values = new BigDecimal[12];
        for (int index = 0; index < values.length; index++) {
            values[index] = BigDecimal.ZERO;
        }
        return values;
    }

    private Lancamento buscarNotaFiscal(Long id) {
        Lancamento lancamento = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!lancamento.isIncluirNotaFiscal()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Este lançamento não está vinculado a uma nota fiscal.");
        }
        return lancamento;
    }

    private String normalizePaymentBank(String bancoPagamento) {
        if (bancoPagamento == null || bancoPagamento.isBlank()) {
            return null;
        }
        String normalizedBank = BANCOS_PAGAMENTO.stream()
                .filter(bank -> bank.equalsIgnoreCase(bancoPagamento.trim()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Selecione um banco disponível na lista."));
        return normalizedBank;
    }

    private void validar(Lancamento lancamento) {
        if (lancamento.getDtLancamento() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a data do lançamento.");
        }
        if (lancamento.getVlLancamento() == null
                || lancamento.getVlLancamento().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O valor deve ser maior que zero.");
        }
        BigDecimal valor = lancamento.getVlLancamento();
        if (valor.scale() > 2 || valor.precision() - valor.scale() > 13) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "O valor aceita até 13 dígitos inteiros e 2 casas decimais.");
        }
        if (lancamento.getCategoria() == null
                || (!"RECEITA".equalsIgnoreCase(lancamento.getCategoria())
                && !"DESPESA".equalsIgnoreCase(lancamento.getCategoria()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A categoria deve ser RECEITA ou DESPESA.");
        }
        validarTipoLancamento(lancamento.getTipoLancamento());
        if (lancamento.getDescricao() == null || lancamento.getDescricao().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a descrição do lançamento.");
        }
        if (lancamento.getDescricao().length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A descrição aceita até 500 caracteres.");
        }
        if (lancamento.getNrNotaFiscal() != null && lancamento.getNrNotaFiscal().length() > 80) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O número da nota aceita até 80 caracteres.");
        }
        lancamento.setCategoria(lancamento.getCategoria().toUpperCase(Locale.ROOT));
    }

    private ContaBancaria buscarConta(Lancamento lancamento) {
        if (lancamento.getContaBancaria() == null || lancamento.getContaBancaria().getIdConta() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione uma conta bancária.");
        }
        return contaRepository.findById(lancamento.getContaBancaria().getIdConta())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "A conta selecionada não existe."));
    }

    private BigDecimal impacto(Lancamento lancamento) {
        return "RECEITA".equals(lancamento.getCategoria())
                ? lancamento.getVlLancamento()
                : lancamento.getVlLancamento().negate();
    }

    private void aplicarMovimento(ContaBancaria conta, BigDecimal impacto) {
        BigDecimal saldoAtual = conta.getSaldo() == null ? BigDecimal.ZERO : conta.getSaldo();
        conta.setSaldo(saldoAtual.add(impacto));
        contaRepository.save(conta);
    }

    private void ajustarDadosNota(Lancamento lancamento) {
        if (!lancamento.isIncluirNotaFiscal()) {
            lancamento.setNrNotaFiscal(null);
            lancamento.setStatusNotaFiscal(null);
        } else if (lancamento.getStatusNotaFiscal() == null) {
            lancamento.setStatusNotaFiscal(
                    lancamento.getNrNotaFiscal() == null || lancamento.getNrNotaFiscal().isBlank()
                            ? "PENDENTE"
                            : "INFORMADA");
        }
    }

    private void validarTipoLancamento(String tipoLancamento) {
        if (tipoLancamento == null || tipoLancamento.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o tipo do lançamento.");
        }
        if (tipoLancamento.trim().length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O tipo aceita até 100 caracteres.");
        }
    }

    public record ComprovanteDownload(Path path, String originalName, String contentType) {
    }
}
