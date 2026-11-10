package br.com.nexusfin.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "T_NEXUSFIN_LANCAMENTOS")
public class Lancamento {

    @ManyToOne
    @JoinColumn(name = "id_conta", nullable = true)
    private ContaBancaria contaBancaria;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lancamento")
    private Long idLancamento;

    @Column(name = "dt_lancamento", nullable = false)
    private LocalDate dtLancamento;

    @Column(name = "vl_lancamento", nullable = false, precision = 15, scale = 2)
    private BigDecimal vlLancamento;

    @Column(name = "categoria", nullable = false, length = 20)
    private String categoria;

    @Column(name = "tipo_lancamento", nullable = false, length = 100)
    private String tipoLancamento;

    @Column(name = "descricao", nullable = false, length = 500)
    private String descricao;

    @Column(name = "incluir_nota_fiscal", nullable = false)
    private boolean incluirNotaFiscal;

    @Column(name = "nr_nota_fiscal", length = 80)
    private String nrNotaFiscal;

    @Column(name = "status_nota_fiscal", length = 20)
    private String statusNotaFiscal;

    @Column(name = "status_pagamento", nullable = false, length = 20)
    private String statusPagamento = "PENDENTE";

    @Column(name = "banco_pagamento", length = 40)
    private String bancoPagamento;

    @Column(name = "comprovante_nome", length = 255)
    private String comprovanteNome;

    @Column(name = "comprovante_tipo", length = 100)
    private String comprovanteTipo;

    @JsonIgnore
    @Column(name = "comprovante_arquivo", length = 80)
    private String comprovanteArquivo;

    public Long getIdLancamento() {
        return idLancamento;
    }

    public void setIdLancamento(Long idLancamento) {
        this.idLancamento = idLancamento;
    }

    public LocalDate getDtLancamento() {
        return dtLancamento;
    }

    public void setDtLancamento(LocalDate dtLancamento) {
        this.dtLancamento = dtLancamento;
    }

    public BigDecimal getVlLancamento() {
        return vlLancamento;
    }

    public void setVlLancamento(BigDecimal vlLancamento) {
        this.vlLancamento = vlLancamento;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getTipoLancamento() {
        return tipoLancamento;
    }

    public void setTipoLancamento(String tipoLancamento) {
        this.tipoLancamento = tipoLancamento;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public boolean isIncluirNotaFiscal() {
        return incluirNotaFiscal;
    }

    public void setIncluirNotaFiscal(boolean incluirNotaFiscal) {
        this.incluirNotaFiscal = incluirNotaFiscal;
    }

    public String getNrNotaFiscal() {
        return nrNotaFiscal;
    }

    public void setNrNotaFiscal(String nrNotaFiscal) {
        this.nrNotaFiscal = nrNotaFiscal;
    }

    public String getStatusNotaFiscal() {
        return statusNotaFiscal;
    }

    public void setStatusNotaFiscal(String statusNotaFiscal) {
        this.statusNotaFiscal = statusNotaFiscal;
    } 

    public String getStatusPagamento() {
        return statusPagamento;
    }

    public void setStatusPagamento(String statusPagamento) {
        this.statusPagamento = statusPagamento;
    }

    public String getBancoPagamento() {
        return bancoPagamento;
    }

    public void setBancoPagamento(String bancoPagamento) {
        this.bancoPagamento = bancoPagamento;
    }

    public String getComprovanteNome() {
        return comprovanteNome;
    }

    public void setComprovanteNome(String comprovanteNome) {
        this.comprovanteNome = comprovanteNome;
    }

    public String getComprovanteTipo() {
        return comprovanteTipo;
    }

    public void setComprovanteTipo(String comprovanteTipo) {
        this.comprovanteTipo = comprovanteTipo;
    }

    public String getComprovanteArquivo() {
        return comprovanteArquivo;
    }

    public void setComprovanteArquivo(String comprovanteArquivo) {
        this.comprovanteArquivo = comprovanteArquivo;
    }

    public boolean isComprovanteDisponivel() {
        return comprovanteArquivo != null && !comprovanteArquivo.isBlank();
    }

    public ContaBancaria getContaBancaria() {
        return contaBancaria;
    }

    public void setContaBancaria(ContaBancaria contaBancaria) {
        this.contaBancaria = contaBancaria;
    }
}