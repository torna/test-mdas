<?php

namespace Front\FrontBundle\Repository;

class TeachersRepository extends UserRepository {

    public function addUserData($id, $params) {
        unset($params['age']);
        parent::addUserData($id, $params);
    }

    public function getTeacherScheduleData($teacher_id) {
        $return = array();

        // getting teachers courses
        $query = "
            SELECT ac.*, so.*, ac.id as id
            FROM available_courses ac, system_objects so
            WHERE ac.teacher_id=:teacher_id
            AND ac.object_id=so.id
            AND ac.course_status IN('waiting', 'ongoing', 'finished')
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id));
        $courses = $q->fetchAll(2);

        // for each course get schedule
        $cnt = count($courses);
        for ($i = 0; $i < $cnt; $i++) {
            $course_id = $courses[$i]['id'];
            $query = "
                SELECT cs.* 
                FROM course_schedule cs
                WHERE cs.course_id=" . $course_id . "
            ";
            $q = $this->getEntityManager()->getConnection()->executeQuery($query, array());
            $course_schedule = $q->fetchAll(2);
            $return[$course_id] = array('data' => $courses[$i], 'schedule' => $course_schedule);
        }

        return $return;
    }

    public function getTeachersWithObjects($active = true, $teacher_id = false) {
        $return = array();
        $sql = '';

        if ($active) {
            $sql .= ' AND t.is_deleted=0 AND t.is_activated=1 AND t.has_completed_profile=1';
        }

        if (is_numeric($teacher_id)) {
            $sql .= ' AND t.id='.$teacher_id;
        }
        $query = "
            SELECT * 
            FROM teachers t
            WHERE 1=1
            " . $sql . "
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array());
        $teacher_list = $q->fetchAll(2);

        $cnt = count($teacher_list);
        for ($i = 0; $i < $cnt; $i++) {
            $query = "
                SELECT so.*, to.experience_years
                FROM system_objects so, teacher_objects `to`
                WHERE `to`.object_id=so.id
                AND so.is_active=1
                AND `to`.teacher_id=" . $teacher_list[$i]['id'] . "
            ";
            $q = $this->getEntityManager()->getConnection()->executeQuery($query, array());
            $teacher_objects = $q->fetchAll(2);
            $return[] = array('teacher_data' => $teacher_list[$i], 'teacher_objects' => $teacher_objects);
        }
        return $return;
    }

    /**
     * used in UserRepository
     * @return string
     */
    public function getTableName() {
        return 'teachers';
    }

}