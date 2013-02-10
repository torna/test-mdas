<?php

namespace Front\FrontBundle\Repository;
use Doctrine\ORM\EntityRepository;

class TeacherQuestionOptionsRepository extends EntityRepository {

    public function createQuestionAnswers($question_id, $answers, $answers_order) {
        if(empty($answers)) {
            return;
        }
        $inserts = array();

        $query = "
            INSERT INTO teacher_question_options(question_id, option_value, option_order)
            VALUES 
        ";

        $cnt = count($answers);
        for ($i = 0; $i < $cnt; $i++) {
            if(trim($answers[$i]) == '') {
                continue;
            }
            $inserts[] = "(".$question_id.", '".  mysql_real_escape_string($answers[$i])."', '".  mysql_real_escape_string($answers_order[$i])."')";
        }

        $q = $this->getEntityManager()->getConnection()->executeQuery($query.  implode(', ', $inserts), array());
        return $this->getEntityManager()->getConnection()->lastInsertId();
    }
    
    public function getQuestionOptionsByTeacherId($teacher_id, $question_id) {
        $query = "
            SELECT tqo.*
            FROM teacher_tests tt, teacher_test_questions ttq, teacher_question_options tqo
            WHERE tt.teacher_id=:teacher_id
            AND ttq.id=:question_id
            AND ttq.test_id=tt.id
            AND tqo.question_id=ttq.id
            ORDER BY tqo.option_order ASC
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':question_id' => $question_id));
        $result = $q->fetchAll(2);
        return $result;
    }
    
    public function getQuestionOptionsByQuestionId($question_id) {
        $query = "
            SELECT tqo.*
            FROM teacher_tests tt, teacher_test_questions ttq, teacher_question_options tqo
            WHERE ttq.id=:question_id
            AND ttq.test_id=tt.id
            AND tqo.question_id=ttq.id
            ORDER BY tqo.option_order ASC
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':question_id' => $question_id));
        $result = $q->fetchAll(2);
        return $result;
    }
}