package br.com.nexusfin.services;

import br.com.nexusfin.models.ContaBancaria;
import br.com.nexusfin.models.Usuario;
import br.com.nexusfin.repositories.ContaBancariaRepository;
import br.com.nexusfin.repositories.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import br.com.nexusfin.repositories.LancamentoRepository;

import java.util.List;
import java.util.Optional;

@Service
public class ContaBancariaService {

    private final ContaBancariaRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final LancamentoRepository lancamentoRepository;

    public ContaBancariaService(
            ContaBancariaRepository repository,
            UsuarioRepository usuarioRepository,
            LancamentoRepository lancamentoRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
        this.lancamentoRepository = lancamentoRepository;
    }

    public List<ContaBancaria> listarTodas() {
        return repository.findAll();
    }

    public Optional<ContaBancaria> buscarPorId(Long id) {
        return repository.findById(id);
    }

    public ContaBancaria salvar(ContaBancaria conta) {
        if (conta.getUsuario() == null) {
            Usuario usuario = usuarioRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Cadastre um usuário antes de adicionar uma conta."));
            conta.setUsuario(usuario);
        }
        return repository.save(conta);
    }

    public Optional<ContaBancaria> atualizar(Long id, ContaBancaria dados) {
        return repository.findById(id).map(conta -> {
            conta.setNrConta(dados.getNrConta());
            conta.setSaldo(dados.getSaldo());
            return repository.save(conta);
        });
    }

    public void deletar(Long id) {
        if (lancamentoRepository.existsByContaBancaria_IdConta(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Não é possível excluir uma conta com lançamentos vinculados.");
        }
        repository.deleteById(id);
    }
}