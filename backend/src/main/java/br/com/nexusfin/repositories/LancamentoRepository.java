package br.com.nexusfin.repositories;

import br.com.nexusfin.models.Lancamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LancamentoRepository extends JpaRepository<Lancamento, Long> {
    boolean existsByContaBancaria_IdConta(Long idConta);
}
