package br.com.nexusfin.services;

import br.com.nexusfin.repositories.ContaBancariaRepository;
import br.com.nexusfin.repositories.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UsuarioServiceTest {

    private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
    private final ContaBancariaRepository contaRepository = mock(ContaBancariaRepository.class);
    private final UsuarioService service = new UsuarioService(usuarioRepository, contaRepository);

    @Test
    void rejectsDeletingUserWithLinkedAccounts() {
        when(contaRepository.existsByUsuario_IdUsuario(7L)).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class, () -> service.deletar(7L));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(usuarioRepository, never()).deleteById(7L);
    }

    @Test
    void reportsDatabaseConstraintConflictWhenDeletionIsBlocked() {
        when(contaRepository.existsByUsuario_IdUsuario(7L)).thenReturn(false);
        org.mockito.Mockito.doThrow(new DataIntegrityViolationException("foreign key"))
                .when(usuarioRepository).deleteById(7L);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class, () -> service.deletar(7L));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
    }
}
