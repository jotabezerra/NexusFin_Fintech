package br.com.nexusfin;

import br.com.nexusfin.models.Usuario;
import br.com.nexusfin.repositories.UsuarioRepository;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class NexusfinApplicationTests {

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void createsDemoUserWhenDatabaseIsEmpty() {
		List<Usuario> users = usuarioRepository.findAll();

		Assertions.assertEquals(1, users.size());
		Assertions.assertEquals("Usuário de demonstração", users.get(0).getNome());
		Assertions.assertEquals("demo@nexusfin.local", users.get(0).getEmail());
	}
}
