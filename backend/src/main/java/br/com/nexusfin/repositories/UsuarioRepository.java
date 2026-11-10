package br.com.nexusfin.repositories;

import br.com.nexusfin.models.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // O JpaRepository já traz o save(), findAll(), findById(), deleteById() prontos a usar!
}