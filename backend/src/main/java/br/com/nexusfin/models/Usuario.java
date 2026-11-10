package br.com.nexusfin.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "T_NEXUSFIN_USUARIOS")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_usuarios")
    @SequenceGenerator(
            name = "seq_usuarios",
            sequenceName = "SQ_NEXUSFIN_USUARIOS",
            allocationSize = 1)
    @Column(name = "id_usuario")
    private Long idUsuario;

    private String nome;
    
    private String email;

    @Column(name = "dt_criacao")
    private LocalDate dtCriacao;

    // Relacionamento 1:N (Um utilizador tem várias contas)
    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    private List<ContaBancaria> contas;

    // Construtor vazio (Obrigatório no JPA)
    public Usuario() {}

    // Getters e Setters
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDate getDtCriacao() { return dtCriacao; }
    public void setDtCriacao(LocalDate dtCriacao) { this.dtCriacao = dtCriacao; }
}