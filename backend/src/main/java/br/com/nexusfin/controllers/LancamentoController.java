package br.com.nexusfin.controllers;

import br.com.nexusfin.models.Lancamento;
import br.com.nexusfin.dto.AtualizarTipoLancamentoRequest;
import br.com.nexusfin.dto.AtualizarStatusPagamentoRequest;
import br.com.nexusfin.services.LancamentoService;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lancamentos")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500"
})
public class LancamentoController {

    private final LancamentoService service;

    public LancamentoController(LancamentoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Lancamento> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lancamento> buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Lancamento> criar(@RequestBody Lancamento lancamento) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.salvar(lancamento));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Lancamento> atualizar(@PathVariable Long id, @RequestBody Lancamento lancamento) {
        return ResponseEntity.ok(service.atualizar(id, lancamento));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/tipo")
    public Lancamento atualizarTipo(
            @PathVariable Long id,
            @RequestBody AtualizarTipoLancamentoRequest request) {
        return service.atualizarTipo(id, request.tipoLancamento());
    }

    @PutMapping("/{id}/pagamento")
    public Lancamento atualizarStatusPagamento(
            @PathVariable Long id,
            @RequestBody AtualizarStatusPagamentoRequest request) {
        return service.atualizarStatusPagamento(id, request.statusPagamento(), request.bancoPagamento());
    }

    @PostMapping(value = "/{id}/comprovante", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Lancamento anexarComprovante(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return service.anexarComprovante(id, file);
    }

    @GetMapping("/{id}/comprovante")
    public ResponseEntity<Resource> baixarComprovante(@PathVariable Long id) {
        LancamentoService.ComprovanteDownload comprovante = service.obterComprovante(id);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(comprovante.originalName(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(comprovante.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(new FileSystemResource(comprovante.path()));
    }
}