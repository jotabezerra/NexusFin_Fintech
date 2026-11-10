package br.com.nexusfin.dto;

import java.math.BigDecimal;
import java.util.List;

public record ResumoFinanceiro(
        int ano,
        BigDecimal totalReceitas,
        BigDecimal totalDespesas,
        BigDecimal saldo,
        long notasFiscais,
        List<ResumoMensal> mensal,
        List<ResumoCategoria> categorias) {
}
