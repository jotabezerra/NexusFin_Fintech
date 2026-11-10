package br.com.nexusfin.services;

import br.com.nexusfin.models.Usuario;
import br.com.nexusfin.repositories.ContaBancariaRepository;
import br.com.nexusfin.repositories.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final ContaBancariaRepository contaRepository;

    public UsuarioService(UsuarioRepository repository, ContaBancariaRepository contaRepository) {
        this.repository = repository;
        this.contaRepository = contaRepository;
    }

    // Regra: Consultar todos
    public List<Usuario> listarTodos() {
        return repository.findAll();
    }

    // Regra: Consultar por ID
    public Optional<Usuario> buscarPorId(Long id) {
        return repository.findById(id);
    }

    // Regra: Criar ou Atualizar
    public Usuario salvar(Usuario usuario) {
        return repository.save(usuario);
    }

    public Optional<Usuario> atualizar(Long id, Usuario dados) {
        return repository.findById(id).map(usuario -> {
            usuario.setNome(dados.getNome());
            usuario.setEmail(dados.getEmail());
            usuario.setDtCriacao(dados.getDtCriacao());
            return repository.save(usuario);
        });
    }

    // Regra: Deletar
    @Transactional
    public void deletar(Long id) {
        if (contaRepository.existsByUsuario_IdUsuario(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Remova ou transfira as contas vinculadas antes de excluir o usuário.");
        }
        try {
            repository.deleteById(id);
            repository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Não é possível excluir este usuário porque existem dados vinculados.",
                    exception);
        }
    }
}