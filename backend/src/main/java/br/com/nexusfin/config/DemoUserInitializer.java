package br.com.nexusfin.config;

import br.com.nexusfin.models.Usuario;
import br.com.nexusfin.repositories.UsuarioRepository;
import java.time.LocalDate;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DemoUserInitializer implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;

    public DemoUserInitializer(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (usuarioRepository.count() > 0) {
            return;
        }

        Usuario demoUser = new Usuario();
        demoUser.setNome("Usuário de demonstração");
        demoUser.setEmail("demo@nexusfin.local");
        demoUser.setDtCriacao(LocalDate.now());
        usuarioRepository.save(demoUser);
    }
}
