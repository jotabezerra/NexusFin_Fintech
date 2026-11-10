package br.com.nexusfin.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;

@Entity
@Table(name = "T_NEXUSFIN_CONTAS_BANCARIAS")
public class ContaBancaria {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_contas_bancarias")
    @SequenceGenerator(
            name = "seq_contas_bancarias",
            sequenceName = "SQ_NEXUSFIN_CONTAS_BANCARIAS",
            allocationSize = 1)
    @Column(name = "id_conta")
    private Long idConta;

    @Column(name = "nr_conta")
    private String nrConta;

    @Column(precision = 15, scale = 2)
    private BigDecimal saldo;

    // Relacionamento N:1 (Várias contas pertencem a um utilizador)
    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnore // Evita loop infinito ao gerar o JSON da API
    private Usuario usuario;

    public ContaBancaria() {}

    public Long getIdConta() { return idConta; }
    public void setIdConta(Long idConta) { this.idConta = idConta; }

    public String getNrConta() { return nrConta; }
    public void setNrConta(String nrConta) { this.nrConta = nrConta; }

    public BigDecimal getSaldo() { return saldo; }
    public void setSaldo(BigDecimal saldo) { this.saldo = saldo; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
}