package br.com.nexusfin.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ComprovanteStorageService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private final Path storageDirectory;

    public ComprovanteStorageService(
            @Value("${nexusfin.upload-dir:./data/comprovantes}") String uploadDirectory) {
        this.storageDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }

    public StoredProof store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione um comprovante.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.CONTENT_TOO_LARGE, "O comprovante deve ter até 10 MB.");
        }

        String originalName = sanitizeOriginalName(file.getOriginalFilename());
        String extension = extensionOf(originalName);
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Não foi possível ler o arquivo enviado.", exception);
        }

        String contentType = detectAndValidateType(extension, content);
        String storedName = UUID.randomUUID() + "." + extension;
        Path destination = resolveStoredName(storedName);
        try {
            Files.createDirectories(storageDirectory);
            Files.write(destination, content, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível salvar o comprovante no servidor.", exception);
        }
        return new StoredProof(storedName, originalName, contentType);
    }

    public Path locate(String storedName) {
        Path path = resolveStoredName(storedName);
        if (!Files.isRegularFile(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo do comprovante não encontrado.");
        }
        return path;
    }

    private Path resolveStoredName(String storedName) {
        if (storedName == null || !storedName.matches("[0-9a-fA-F-]{36}\\.(pdf|jpg|png)")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo do comprovante não encontrado.");
        }
        Path resolved = storageDirectory.resolve(storedName).normalize();
        if (!resolved.startsWith(storageDirectory)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo do comprovante não encontrado.");
        }
        return resolved;
    }

    private String sanitizeOriginalName(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O arquivo precisa ter um nome válido.");
        }
        String fileName = originalName.replace('\\', '/');
        fileName = fileName.substring(fileName.lastIndexOf('/') + 1)
                .replaceAll("[\\p{Cntrl}]", "")
                .trim();
        if (fileName.isBlank() || fileName.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O nome do arquivo deve ter até 255 caracteres.");
        }
        return fileName;
    }

    private String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Envie um arquivo PDF, JPG ou PNG.");
        }
        String extension = fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
        if (!extension.equals("pdf") && !extension.equals("jpg") && !extension.equals("png")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Envie um arquivo PDF, JPG ou PNG.");
        }
        return extension;
    }

    private String detectAndValidateType(String extension, byte[] content) {
        boolean isPdf = content.length >= 5
                && content[0] == '%'
                && content[1] == 'P'
                && content[2] == 'D'
                && content[3] == 'F'
                && content[4] == '-';
        boolean isJpeg = content.length >= 3
                && (content[0] & 0xFF) == 0xFF
                && (content[1] & 0xFF) == 0xD8
                && (content[2] & 0xFF) == 0xFF;
        boolean isPng = content.length >= 8
                && (content[0] & 0xFF) == 0x89
                && content[1] == 'P'
                && content[2] == 'N'
                && content[3] == 'G'
                && (content[4] & 0xFF) == 0x0D
                && (content[5] & 0xFF) == 0x0A
                && (content[6] & 0xFF) == 0x1A
                && (content[7] & 0xFF) == 0x0A;

        if ((extension.equals("pdf") && isPdf)) return "application/pdf";
        if ((extension.equals("jpg") && isJpeg)) return "image/jpeg";
        if ((extension.equals("png") && isPng)) return "image/png";
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "O conteúdo do arquivo não corresponde a um PDF, JPG ou PNG válido.");
    }

    public record StoredProof(String storedName, String originalName, String contentType) {
    }
}
