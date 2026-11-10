package br.com.nexusfin.dto;

import java.math.BigDecimal;

public record ResumoMensal(int mes, BigDecimal receitas, BigDecimal despesas) {
}
