package net.refound.api.common.response;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * A page of results, flattened for the client.
 *
 * <p>Spring's own {@code Page} serialises with a large, unstable envelope
 * (including the full {@code Pageable} and sort descriptors) and warns about it
 * at startup. This is the contract we actually want to keep.
 *
 * <p>Every list endpoint returns one of these. Nothing returns an unbounded
 * array — a browse endpoint over a full semester of reports would be enormous.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    /**
     * Maps entities to DTOs while preserving the paging metadata — the usual
     * case, since entities must never be serialised directly.
     */
    public static <E, D> PageResponse<D> from(Page<E> page, Function<E, D> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }
}
