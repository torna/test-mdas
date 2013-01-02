<?php

namespace Front\FrontBundle\Repository;
use Doctrine\ORM\EntityRepository;

class SystemObjectsRepository extends EntityRepository {

    /**
     * teacher objects
     * @param type $teacher_id
     * @return type
     */
    public function getObjects($teacher_id=false) {
        $sub_query = '';
        if($teacher_id) {
            $sub_query = " AND so.id NOT IN(SELECT object_id FROM teacher_objects WHERE teacher_id='".$teacher_id."')";
        }
        
        $query = "
            SELECT so.*, ssc.object_category_ro, ssc.object_category_ru, ssc.object_category_en
            FROM system_objects so, system_subjects_categories ssc
            WHERE so.object_category=ssc.id
            AND so.is_active=1
            AND ssc.is_active=1
            ".$sub_query."
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array());
        $result = $q->fetchAll(2);

        return $result;
    }
    
}