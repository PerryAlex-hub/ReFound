package net.refound.api.item.repository;

import net.refound.api.item.domain.ItemPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ItemPhotoRepository extends JpaRepository<ItemPhoto, UUID> {

    List<ItemPhoto> findByItemIdOrderByPositionAsc(UUID itemId);

    long countByItemId(UUID itemId);
}
