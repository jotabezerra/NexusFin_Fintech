package br.com.nexusfin.services;

import br.com.nexusfin.models.ContaBancaria;
import br.com.nexusfin.models.Usuario;
import br.com.nexusfin.repositories.ContaBancariaRepository;
import br.com.nexusfin.repositories.LancamentoRepository;
import br.com.nexusfin.repositories.UsuarioRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ContaBancariaServiceTest {

    private final ContaBancariaRepository repository = mock(ContaBancariaRepository.class);
    private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
    private final LancamentoRepository lancamentoRepository = mock(LancamentoRepository.class);
    private final ContaBancariaService service = new ContaBancariaService(repository, usuarioRepository, lancamentoRepository);

    @Test
    void associatesNewAccountWithAnExistingUser() {
        Usuario usuario = new Usuario();
        ContaBancaria conta = conta("12345-6", "250.00");
        when(usuarioRepository.findAll()).thenReturn(List.of(usuario));
        when(repository.save(any(ContaBancaria.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContaBancaria saved = service.salvar(conta);

        assertSame(usuario, saved.getUsuario());
        assertEquals("12345-6", saved.getNrConta());
        verify(repository).save(conta);
    }

    @Test
    void rejectsNewAccountWhenThereAreNoUsers() {
        when(usuarioRepository.findAll()).thenReturn(List.of());

        assertThrows(ResponseStatusException.class, () -> service.salvar(conta("12345-6", "250.00")));

        verify(repository, never()).save(any(ContaBancaria.class));
    }

    @Test
    void updatesAccountDetailsWithoutChangingItsUser() {
        Usuario usuario = new Usuario();
        ContaBancaria existing = conta("11111-1", "100.00");
        existing.setUsuario(usuario);
        when(repository.findById(7L)).thenReturn(Optional.of(existing));
        when(repository.save(any(ContaBancaria.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContaBancaria updated = service.atualizar(7L, conta("22222-2", "350.00")).orElseThrow();

        assertEquals("22222-2", updated.getNrConta());
        assertEquals(new BigDecimal("350.00"), updated.getSaldo());
        assertSame(usuario, updated.getUsuario());
    }

    @Test
    void rejectsDeletingAccountWithLinkedEntries() {
        when(lancamentoRepository.existsByContaBancaria_IdConta(7L)).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class, () -> service.deletar(7L));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(repository, never()).deleteById(7L);
    }

    private ContaBancaria conta(String numero, String saldo) {
        ContaBancaria conta = new ContaBancaria();
        conta.setNrConta(numero);
        conta.setSaldo(new BigDecimal(saldo));
        return conta;
    }
}
