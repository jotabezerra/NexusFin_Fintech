package br.com.nexusfin.controllers;

import br.com.nexusfin.dto.ResumoFinanceiro;
import br.com.nexusfin.services.LancamentoService;
import java.time.Year;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/analises")
@CrossOrigin("*")
public class AnaliseController {

    private final LancamentoService service;

    public AnaliseController(LancamentoService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ResumoFinanceiro> resumir(
            @RequestParam(defaultValue = "") String ano) {
        int anoSelecionado;
        try {
            anoSelecionado = ano.isBlank() ? Year.now().getValue() : Integer.parseInt(ano);
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ano inválido.");
        }
        if (anoSelecionado < 2000 || anoSelecionado > 2100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ano fora do intervalo permitido.");
        }
        return ResponseEntity.ok(service.resumir(anoSelecionado));
    }
}
