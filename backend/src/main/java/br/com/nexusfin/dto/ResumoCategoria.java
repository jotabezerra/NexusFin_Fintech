package br.com.nexusfin.dto;

import java.math.BigDecimal;

public record ResumoCategoria(
        String tipoLancamento,
        BigDecimal entradas,
        BigDecimal saidas,
        BigDecimal saldo) {
}
