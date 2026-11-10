package br.com.nexusfin.services;

import br.com.nexusfin.models.Lancamento;
import br.com.nexusfin.models.ContaBancaria;
import br.com.nexusfin.repositories.ContaBancariaRepository;
import br.com.nexusfin.repositories.LancamentoRepository;
import java.nio.file.Path;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.mock.web.MockMultipartFile;

class LancamentoServiceTest {

    private final LancamentoRepository repository = mock(LancamentoRepository.class);
    private final ContaBancariaRepository contaRepository = mock(ContaBancariaRepository.class);
    private final ComprovanteStorageService comprovanteStorage = mock(ComprovanteStorageService.class);
    private final LancamentoService service = new LancamentoService(repository, contaRepository, comprovanteStorage);

    @Test
    void summarizesIncomeAndExpensesByYear() {
        Lancamento receita = lancamento(100L, "RECEITA", "100.00", "2026-03-10", true);
        Lancamento despesa = lancamento(101L, "DESPESA", "35.50", "2026-03-12", false);
        Lancamento outroAno = lancamento(102L, "RECEITA", "500.00", "2025-03-10", true);
        when(repository.findAll()).thenReturn(List.of(receita, despesa, outroAno));

        var resumo = service.resumir(2026);

        assertEquals(new BigDecimal("100.00"), resumo.totalReceitas());
        assertEquals(new BigDecimal("35.50"), resumo.totalDespesas());
        assertEquals(new BigDecimal("64.50"), resumo.saldo());
        assertEquals(1, resumo.notasFiscais());
        assertEquals(new BigDecimal("100.00"), resumo.mensal().get(2).receitas());
        assertEquals(new BigDecimal("35.50"), resumo.mensal().get(2).despesas());
        assertEquals(2, resumo.categorias().size());
        assertEquals("Vendas", resumo.categorias().get(0).tipoLancamento());
        assertEquals(new BigDecimal("100.00"), resumo.categorias().get(0).entradas());
        assertEquals("Marketing", resumo.categorias().get(1).tipoLancamento());
        assertEquals(new BigDecimal("35.50"), resumo.categorias().get(1).saidas());
    }

    @Test
    void rejectsNonPositiveAmounts() {
        Lancamento lancamento = lancamento(null, "RECEITA", "0", "2026-03-10", false);

        assertThrows(ResponseStatusException.class, () -> service.salvar(lancamento));
    }

    @Test
    void rejectsAmountsWithMoreThanTwoDecimalPlaces() {
        Lancamento lancamento = lancamento(null, "RECEITA", "10.123", "2026-03-10", false);

        assertThrows(ResponseStatusException.class, () -> service.salvar(lancamento));
    }

    @Test
    void preservesTheSelectedEntryTypeWhenSaving() {
        Lancamento lancamento = lancamento(null, "RECEITA", "100.00", "2026-03-10", false);
        lancamento.setTipoLancamento("Vendas");
        ContaBancaria conta = conta(1L, "50.00");
        lancamento.setContaBancaria(conta);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(contaRepository.save(any(ContaBancaria.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(repository.save(any(Lancamento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Lancamento saved = service.salvar(lancamento);

        assertEquals("Vendas", saved.getTipoLancamento());
        assertEquals(new BigDecimal("150.00"), conta.getSaldo());
        assertEquals(conta, saved.getContaBancaria());
    }

    @Test
    void allowsExpenseToMakeAccountBalanceNegative() {
        Lancamento lancamento = lancamento(null, "DESPESA", "75.00", "2026-03-10", false);
        ContaBancaria conta = conta(1L, "20.00");
        lancamento.setContaBancaria(conta);
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(contaRepository.save(any(ContaBancaria.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(repository.save(any(Lancamento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.salvar(lancamento);

        assertEquals(new BigDecimal("-55.00"), conta.getSaldo());
    }

    @Test
    void requiresAnAccountBeforeCreatingAnEntry() {
        Lancamento lancamento = lancamento(null, "RECEITA", "100.00", "2026-03-10", false);

        assertThrows(ResponseStatusException.class, () -> service.salvar(lancamento));
    }

    @Test
    void updatesTheTypeOfAnExistingEntry() {
        Lancamento lancamento = lancamento(100L, "RECEITA", "100.00", "2026-03-10", false);
        when(repository.findById(100L)).thenReturn(Optional.of(lancamento));
        when(repository.save(any(Lancamento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Lancamento updated = service.atualizarTipo(100L, "Exportação");

        assertEquals("Exportação", updated.getTipoLancamento());
    }

    @Test
    void requiresAnEntryTypeBeforeSaving() {
        Lancamento lancamento = lancamento(null, "RECEITA", "100.00", "2026-03-10", false);
        lancamento.setTipoLancamento(null);

        assertThrows(ResponseStatusException.class, () -> service.salvar(lancamento));
    }

    @Test
    void marksInvoiceAsDemonstrationOnly() {
        Lancamento lancamento = lancamento(7L, "RECEITA", "100.00", "2026-03-10", true);
        when(repository.findById(7L)).thenReturn(Optional.of(lancamento));
        when(repository.save(any(Lancamento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Lancamento result = service.simularEmissao(7L);

        assertEquals("DEMO-000007", result.getNrNotaFiscal());
        assertEquals("SIMULADA", result.getStatusNotaFiscal());
    }

    @Test
    void updatesPaymentStatusForInvoice() {
        Lancamento lancamento = lancamento(7L, "RECEITA", "100.00", "2026-03-10", true);
        when(repository.findById(7L)).thenReturn(Optional.of(lancamento));
        when(repository.save(any(Lancamento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Lancamento result = service.atualizarStatusPagamento(7L, "paga", "Nubank");

        assertEquals("PAGA", result.getStatusPagamento());
        assertEquals("Nubank", result.getBancoPagamento());
    }

    @Test
    void rejectsPaymentStatusForRecordsWithoutInvoice() {
        Lancamento lancamento = lancamento(7L, "RECEITA", "100.00", "2026-03-10", false);
        when(repository.findById(7L)).thenReturn(Optional.of(lancamento));

        assertThrows(ResponseStatusException.class,
                () -> service.atualizarStatusPagamento(7L, "PAGA", "Nubank"));
    }

    @Test
    void requiresBankWhenMarkingInvoiceAsPaid() {
        Lancamento lancamento = lancamento(7L, "RECEITA", "100.00", "2026-03-10", true);
        when(repository.findById(7L)).thenReturn(Optional.of(lancamento));

        assertThrows(ResponseStatusException.class,
                () -> service.atualizarStatusPagamento(7L, "PAGA", null));
    }

    @Test
    void rejectsBankOutsideAvailableList() {
        Lancamento lancamento = lancamento(7L, "RECEITA", "100.00", "2026-03-10", true);
        when(repository.findById(7L)).thenReturn(Optional.of(lancamento));

        assertThrows(ResponseStatusException.class,
                () -> service.atualizarStatusPagamento(7L, "PAGA", "Banco não cadastrado"));
    }

    @Test
    void attachesProofOnlyAfterInvoiceIsMarkedPaid() {
        Lancamento lancamento = lancamento(7L, "RECEITA", "100.00", "2026-03-10", true);
        lancamento.setStatusPagamento("PAGA");
        MockMultipartFile file = new MockMultipartFile(
                "file", "comprovante.pdf", "application/pdf", "%PDF-1.7".getBytes());
        when(repository.findById(7L)).thenReturn(Optional.of(lancamento));
        when(comprovanteStorage.store(file)).thenReturn(
                new ComprovanteStorageService.StoredProof("generated.pdf", "comprovante.pdf", "application/pdf"));
        when(repository.save(any(Lancamento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Lancamento result = service.anexarComprovante(7L, file);

        assertEquals("comprovante.pdf", result.getComprovanteNome());
        assertEquals("application/pdf", result.getComprovanteTipo());
        assertEquals("generated.pdf", result.getComprovanteArquivo());
        assertEquals(true, result.isComprovanteDisponivel());
    }

    @Test
    void rejectsProofWhenInvoiceHasNotBeenPaid() {
        Lancamento lancamento = lancamento(7L, "RECEITA", "100.00", "2026-03-10", true);
        when(repository.findById(7L)).thenReturn(Optional.of(lancamento));

        assertThrows(ResponseStatusException.class, () -> service.anexarComprovante(7L, new MockMultipartFile(
                "file", "comprovante.pdf", "application/pdf", "%PDF-1.7".getBytes())));
    }

    @Test
    void returnsStoredProofForDownload() {
        Lancamento lancamento = lancamento(7L, "RECEITA", "100.00", "2026-03-10", true);
        lancamento.setComprovanteArquivo("generated.pdf");
        lancamento.setComprovanteNome("comprovante.pdf");
        lancamento.setComprovanteTipo("application/pdf");
        Path storedPath = Path.of("data", "comprovantes", "generated.pdf");
        when(repository.findById(7L)).thenReturn(Optional.of(lancamento));
        when(comprovanteStorage.locate("generated.pdf")).thenReturn(storedPath);

        LancamentoService.ComprovanteDownload result = service.obterComprovante(7L);

        assertEquals(storedPath, result.path());
        assertEquals("comprovante.pdf", result.originalName());
        assertEquals("application/pdf", result.contentType());
    }

    @Test
    void reversesTheOldEffectAndAppliesTheUpdatedEntry() {
        ContaBancaria conta = conta(1L, "500.00");
        Lancamento existing = lancamento(25L, "RECEITA", "100.00", "2026-03-10", false);
        existing.setContaBancaria(conta);
        Lancamento updatedData = lancamento(null, "DESPESA", "125.00", "2026-03-11", false);
        updatedData.setContaBancaria(conta(1L, null));
        when(repository.findById(25L)).thenReturn(Optional.of(existing));
        when(contaRepository.findById(1L)).thenReturn(Optional.of(conta));
        when(contaRepository.save(any(ContaBancaria.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(repository.save(any(Lancamento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Lancamento updated = service.atualizar(25L, updatedData);

        assertEquals(new BigDecimal("275.00"), conta.getSaldo());
        assertEquals("DESPESA", updated.getCategoria());
        assertEquals(new BigDecimal("125.00"), updated.getVlLancamento());
        assertEquals(conta, updated.getContaBancaria());
    }

    @Test
    void reversesTheEffectWhenDeletingAnEntry() {
        ContaBancaria conta = conta(1L, "150.00");
        Lancamento lancamento = lancamento(25L, "RECEITA", "100.00", "2026-03-10", false);
        lancamento.setContaBancaria(conta);
        when(repository.findById(25L)).thenReturn(Optional.of(lancamento));
        when(contaRepository.save(any(ContaBancaria.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.deletar(25L);

        assertEquals(new BigDecimal("50.00"), conta.getSaldo());
        verify(repository).delete(lancamento);
    }

    private Lancamento lancamento(Long id, String categoria, String valor, String data, boolean notaFiscal) {
        Lancamento lancamento = new Lancamento();
        lancamento.setIdLancamento(id);
        lancamento.setCategoria(categoria);
        lancamento.setVlLancamento(new BigDecimal(valor));
        lancamento.setDtLancamento(LocalDate.parse(data));
        lancamento.setDescricao("Teste");
        lancamento.setTipoLancamento("RECEITA".equals(categoria) ? "Vendas" : "Marketing");
        lancamento.setIncluirNotaFiscal(notaFiscal);
        return lancamento;
    }

    private ContaBancaria conta(Long id, String saldo) {
        ContaBancaria conta = new ContaBancaria();
        conta.setIdConta(id);
        conta.setSaldo(saldo == null ? null : new BigDecimal(saldo));
        return conta;
    }
}
