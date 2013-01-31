<?php

namespace Front\FrontBundle\Repository;

use Doctrine\ORM\EntityRepository;

class TeacherTestQuestionsRepository extends EntityRepository {

    public function getTestQuestions($teacher_id, $test_id) {
        $query = "
            SELECT ttq.*
            FROM teacher_tests tt, teacher_test_questions ttq
            WHERE tt.teacher_id=:teacher_id
            AND tt.id=:test_id
            AND ttq.test_id=tt.id
            ORDER BY ttq.question_order ASC
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':test_id' => $test_id));
        $result = $q->fetchAll(2);
        return $result;
    }
    
    public function createQuestion($test_id, $question_id, $question, $question_type, $question_order) {
        $params = array();

        if($question_id) { // is update
            // delete question data
            $query = "DELETE FROM teacher_test_questions WHERE id=".$question_id;
            $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
        }
        
        $query = "
            INSERT INTO teacher_test_questions(test_id, question, question_type, question_order)
            VALUES (:test_id, :question, :question_type, :question_order)
        ";

        $params[':test_id'] = $test_id;
        $params[':question'] = $question;
        $params[':question_type'] = $question_type;
        $params[':question_order'] = $question_order;

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
        return $this->getEntityManager()->getConnection()->lastInsertId();
    }
    
    public function createTestPlaceholder($test_id, $question_id, $placeholder_data) {
        $params = array();
        if($test_id) { // is update
            // delete question data
            $query = "DELETE FROM teacher_test_placeholder WHERE test_id=".$test_id;
            $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
        }
        
        $query = "
            INSERT INTO teacher_test_placeholder(test_id, placeholder_text)
            VALUES (:test_id, :placeholder_text)
        ";

        $params[':test_id'] = $test_id;
        $params[':placeholder_text'] = $placeholder_data;

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
        return $this->getEntityManager()->getConnection()->lastInsertId();
    }
    
    public function updateQuestionOrder($question_id, $order) {
        $query = "
            UPDATE teacher_test_questions SET question_order=:question_order
            WHERE id=:question_id
        ";

        $params[':question_id'] = $question_id;
        $params[':question_order'] = $order;

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
    }
    
    public function getQuestionIdByTeacherId($teacher_id, $question_id) {
        $query = "
            SELECT ttq.*
            FROM teacher_tests tt, teacher_test_questions ttq
            WHERE tt.teacher_id=:teacher_id
            AND ttq.id=:question_id
            AND ttq.test_id=tt.id
            ORDER BY ttq.question_order ASC
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':question_id' => $question_id));
        $result = $q->fetch(2);
        return $result;
    }
    
    public function deleteQuestionById($question_id) {
        $query = "DELETE FROM teacher_test_questions WHERE id=".$question_id;
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array());
    }
    
    public function getPlaceholderDataByTestId($test_id) {
        $query = "
            SELECT ttp.*
            FROM teacher_test_placeholder ttp
            WHERE ttp.test_id=:test_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':test_id' => $test_id));
        $result = $q->fetch(2);
        return $result;
    }

}