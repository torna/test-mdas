<?php

namespace Front\FrontBundle\Repository;
use Doctrine\ORM\EntityRepository;

class CourseScheduleRepository extends EntityRepository {

    public function getCourseSchedule($course_id) {
        $query = "
            SELECT *
            FROM course_schedule cs
            WHERE cs.course_id=:course_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':course_id' => $course_id));
        $result = $q->fetchAll(2);

        return $result;
    }

    public function addCourseSchedule($course_id, $schedule) {
        
        $query = "DELETE FROM course_schedule WHERE course_id=:course_id";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':course_id' => $course_id));

        $cnt = count($schedule['day']);
        for ($i = 0; $i < $cnt; $i++) {
            $query = "
                INSERT INTO course_schedule(course_id, day, start_hour, end_hour)
                VALUES('".$course_id."', '".$schedule['day'][$i]."', '".$schedule['start_hour'][$i]."', '".$schedule['finish_hour'][$i]."')
            ";
            $this->getEntityManager()->getConnection()->executeQuery($query, array());
        }
    }
    
    public function deleteScheduleItem($course_id, $schedule_id) {
        $query = "DELETE FROM course_schedule WHERE course_id=:course_id AND id=:id";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':course_id' => $course_id, ':id' => $schedule_id));
    }
    
}