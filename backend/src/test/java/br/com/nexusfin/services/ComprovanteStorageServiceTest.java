package br.com.nexusfin.services;

import java.nio.file.Files;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ComprovanteStorageServiceTest {

    @TempDir
    java.nio.file.Path temporaryDirectory;

    @Test
    void storesPdfWithGeneratedNameAndPreservesOriginalName() throws Exception {
        ComprovanteStorageService service = new ComprovanteStorageService(temporaryDirectory.toString());
        MockMultipartFile file = new MockMultipartFile(
                "file", "pagamento.pdf", "application/pdf", "%PDF-1.7 test".getBytes());

        ComprovanteStorageService.StoredProof stored = service.store(file);

        assertEquals("pagamento.pdf", stored.originalName());
        assertEquals("application/pdf", stored.contentType());
        assertTrue(stored.storedName().matches("[0-9a-fA-F-]{36}\\.pdf"));
        assertTrue(Files.isRegularFile(service.locate(stored.storedName())));
    }

    @Test
    void rejectsFileWithFakePdfExtension() {
        ComprovanteStorageService service = new ComprovanteStorageService(temporaryDirectory.toString());
        MockMultipartFile file = new MockMultipartFile(
                "file", "pagamento.pdf", "application/pdf", "not a pdf".getBytes());

        assertThrows(ResponseStatusException.class, () -> service.store(file));
    }

    @Test
    void rejectsUnsupportedFileExtension() {
        ComprovanteStorageService service = new ComprovanteStorageService(temporaryDirectory.toString());
        MockMultipartFile file = new MockMultipartFile(
                "file", "pagamento.exe", "application/octet-stream", "content".getBytes());

        assertThrows(ResponseStatusException.class, () -> service.store(file));
    }

    @Test
    void rejectsFilesLargerThanTenMegabytes() {
        ComprovanteStorageService service = new ComprovanteStorageService(temporaryDirectory.toString());
        byte[] oversized = new byte[10 * 1024 * 1024 + 1];
        MockMultipartFile file = new MockMultipartFile("file", "pagamento.pdf", "application/pdf", oversized);

        assertThrows(ResponseStatusException.class, () -> service.store(file));
    }
}
