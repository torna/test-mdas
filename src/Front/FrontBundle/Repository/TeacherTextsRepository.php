<?php

namespace Front\FrontBundle\Repository;
use Doctrine\ORM\EntityRepository;

class TeacherTextsRepository extends EntityRepository {

    public function getTeacherTexts($teacher_id) {
        $query = "
            SELECT tt.*
            FROM teacher_texts tt
            WHERE tt.teacher_id=:teacher_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id));
        $result = $q->fetchAll(2);

        return $result;
    }
    
    public function getTeacherTextDetails($teacher_id, $text_id) {
        $query = "
            SELECT tt.*
            FROM teacher_texts tt
            WHERE tt.teacher_id=:teacher_id
            AND tt.id=:text_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':text_id' => $text_id));
        $result = $q->fetch(2);
        return $result;
    }
    
    public function createText($teacher_id, $text_name_public, $text_name_private, $text_desc, $text_content) {
        $params = array();

        $query = "
            INSERT INTO teacher_texts(teacher_id, text_name_public, text_name_private, text_desc, text_content, text_hash, added)
            VALUES (:teacher_id, :text_name_public, :text_name_private, :text_desc, :text_content, :text_hash, NOW())
        ";

        $params[':teacher_id'] = $teacher_id;
        $params[':text_name_public'] = $text_name_public;
        $params[':text_name_private'] = $text_name_private;
        $params[':text_desc'] = $text_desc;
        $params[':text_content'] = $text_content;
        $params[':text_hash'] = md5($teacher_id.$text_name_public.time());

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
        return $this->getEntityManager()->getConnection()->lastInsertId();
    }
    
    public function updateText($teacher_id, $text_id, $text_name_public, $text_name_private, $text_desc, $text_content) {
        $params = array();

        $query = "
            UPDATE teacher_texts SET text_name_public=:text_name_public, text_name_private=:text_name_private, text_desc=:text_desc, text_content=:text_content
            WHERE id=:text_id AND teacher_id=:teacher_id
        ";

        $params[':teacher_id'] = $teacher_id;
        $params[':text_id'] = $text_id;
        $params[':text_name_public'] = $text_name_public;
        $params[':text_name_private'] = $text_name_private;
        $params[':text_desc'] = $text_desc;
        $params[':text_content'] = $text_content;

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
    }
    
    public function deleteText($teacher_id, $text_id) {
        $query = "
            DELETE FROM teacher_texts
            WHERE teacher_id=:teacher_id
            AND id=:text_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':text_id' => $text_id));
    }
    
}