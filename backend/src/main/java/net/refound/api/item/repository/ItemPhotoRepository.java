package net.refound.api.item.repository;

import net.refound.api.item.domain.ItemPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ItemPhotoRepository extends JpaRepository<ItemPhoto, UUID> {

    List<ItemPhoto> findByItemIdOrderByPositionAsc(UUID itemId);

    /**
     * Photos for a whole page of items in one query.
     *
     * <p>The alternative — letting each item lazily load its own collection —
     * is a textbook N+1: one query for the page, then twenty more.
     *
     * <p>Joins the item because the caller groups by item id, and reading it
     * from a lazy proxy would reintroduce the very problem this avoids.
     */
    @Query("select p from ItemPhoto p join fetch p.item where p.item.id in :itemIds order by p.position asc")
    List<ItemPhoto> findByItemIdInOrderByPositionAsc(@Param("itemIds") Collection<UUID> itemIds);

    long countByItemId(UUID itemId);
}
