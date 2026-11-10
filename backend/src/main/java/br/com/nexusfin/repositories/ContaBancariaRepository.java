package br.com.nexusfin.repositories;

import br.com.nexusfin.models.ContaBancaria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContaBancariaRepository extends JpaRepository<ContaBancaria, Long> {
    boolean existsByUsuario_IdUsuario(Long idUsuario);
}