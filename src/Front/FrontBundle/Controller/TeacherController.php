<?php

namespace Front\FrontBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Front\FrontBundle\Security\Auth as Auth;

/**
 * Teacher controller.
 *
 */
class TeacherController extends Controller {

    public function accountAction() {
        if (!(Auth::isAuth() && Auth::getAuthParam('account_type')=='teacher')) {
            return $this->redirect($this->generateUrl('register'));
        }
        
        $em = $this->getDoctrine()->getEntityManager();
        $teacher_objects_cnt = $em->getRepository('FrontFrontBundle:TeacherObjects')->teacherObjectsCnt(Auth::getAuthParam('id'));
        return $this->render('FrontFrontBundle:Account:Teacher/account_home.html.twig', array('teacher_objects_cnt' => $teacher_objects_cnt));
    }
    
    public function teacherObjectsAction() {
        if (!(Auth::isAuth() && Auth::getAuthParam('account_type')=='teacher')) {
            return $this->redirect($this->generateUrl('register'));
        }
        
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();
        
        if($request->get('delete_object_id')) { // deleting an object
            // check if there is an ongoing course with the deleting object for this teacher
            $teacher_objects = $em->getRepository('FrontFrontBundle:AvailableCourses')->getCourseTeacherByObjectId(Auth::getAuthParam('id'), $request->get('delete_object_id'));
            if(empty($teacher_objects)) { // the there are no ongoing or waiting courses 
                $em->getRepository('FrontFrontBundle:TeacherObjects')->deleteTeacherObject(Auth::getAuthParam('id'), $request->get('delete_object_id'));
                $this->get('session')->setFlash('notice', 'The object was deleted.');
            }
        }
        
        if ($request->getMethod() == 'POST') { // saving objects
            $objects = $request->get('object_ids');
            $object_experience = $request->get('object_experience');
            if(!empty($objects)) {
                $teacher_objects = $em->getRepository('FrontFrontBundle:TeacherObjects')->addObjects(Auth::getAuthParam('id'), $objects, $object_experience);
                $this->get('session')->setFlash('notice', 'The objects were added successfully.');
            } else {
                $this->get('session')->setFlash('notice', 'No objects were added.');
            }
            return $this->redirect($this->generateUrl('account_teacher_object'));
        }
        $teacher_objects = $em->getRepository('FrontFrontBundle:TeacherObjects')->teacherObjects(Auth::getAuthParam('id'));

        $system_objects = $em->getRepository('FrontFrontBundle:SystemObjects')->getObjects(Auth::getAuthParam('id'));

        $cnt = count($system_objects);
        $objects_and_cateogries = array();
        for ($i = 0; $i < $cnt; $i++) {
            $object_category = $system_objects[$i]['object_category_ro'];
            $objects_and_cateogries[$object_category][] = $system_objects[$i];
        }
        
        return $this->render('FrontFrontBundle:Account:Teacher/teacher_objects.html.twig', array('teacher_objects' => $teacher_objects, 'objects_and_cateogries' => $objects_and_cateogries));
    }
    
    public function teacherCoursesAction() {
        if (!(Auth::isAuth() && Auth::getAuthParam('account_type')=='teacher')) {
            return $this->redirect($this->generateUrl('register'));
        }
        
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();
        
        if($request->get('delete_course_id')) { // deleting a course
            // check if teacher owns course
            $teacher_owns_course = $em->getRepository('FrontFrontBundle:AvailableCourses')->getCourseTeacherByCourseId(Auth::getAuthParam('id'), $request->get('delete_course_id'));
            if(empty($teacher_owns_course)) { // teacher does not own this course
                die('Error mmddrd3');
            }
            
            $em->getRepository('FrontFrontBundle:AvailableCourses')->setCourseDeleted(Auth::getAuthParam('id'), $request->get('delete_course_id'));
            $this->get('session')->setFlash('notice', 'The course was deleted.');
            return $this->redirect($this->generateUrl('account_teacher_courses'));
        }
        
        if ($request->getMethod() == 'POST') { // saving course
            $object_id = $request->get('object_id');
            $max_nr_students = $request->get('max_nr_students');
            $course_topics = $request->get('course_topics');
            $course_details = $request->get('course_details');
            $starts_on = $request->get('starts_on');
            $finish_on = $request->get('finish_on');
            $language_id = $request->get('language_id');
            $group_name = $request->get('group_name');
            
            if(!is_numeric($object_id) || !is_numeric($max_nr_students) || empty($course_topics) || empty($course_details) || !$starts_on) {
                $this->get('session')->setFlash('error', 'Please fill all required fields.');
                return $this->redirect($this->generateUrl('account_teacher_courses'));
            }
            
            $course_id = $em->getRepository('FrontFrontBundle:AvailableCourses')->createCourse(Auth::getAuthParam('id'), $object_id, $max_nr_students, $course_topics, $course_details, $starts_on, $language_id, $finish_on, $group_name);
            $this->get('session')->setFlash('notice', 'The course was created successfully.');
            
            return $this->redirect($this->generateUrl('account_teacher_course_schedule').'?course_id='.$course_id);
        }
        $teacher_courses = $em->getRepository('FrontFrontBundle:AvailableCourses')->getTeacherCourses(Auth::getAuthParam('id'));
        $teacher_objects = $em->getRepository('FrontFrontBundle:TeacherObjects')->teacherObjects(Auth::getAuthParam('id'));
        $languages = $em->getRepository('FrontFrontBundle:AvailableCourses')->getLanguages();
        
        return $this->render('FrontFrontBundle:Account:Course/teacher_courses.html.twig', array('teacher_courses' => $teacher_courses, 'teacher_objects' => $teacher_objects, 'languages' => $languages));
    }
    
    /**
     * CRUD course schedule
     */
    public function courseScheduleAction() {
        if (!(Auth::isAuth() && Auth::getAuthParam('account_type')=='teacher')) {
            return $this->redirect($this->generateUrl('register'));
        }

        $course_denied_statuses = array('finished', 'ongoing');
        $request = $this->getRequest();
        $course_id = $request->get('course_id');
        if(!is_numeric($course_id)) {
            $this->get('session')->setFlash('error', 'No course was provided.');
            return $this->redirect($this->generateUrl('account_teacher_courses'));
        }
        $em = $this->getDoctrine()->getEntityManager();
        // check if teacher owns course
        $teacher_owns_course = $em->getRepository('FrontFrontBundle:AvailableCourses')->getCourseTeacherByCourseId(Auth::getAuthParam('id'), $course_id);
        if(empty($teacher_owns_course)) { // teacher does not own this course
            $this->get('session')->setFlash('error', 'You do not seem to own this course.');
            return $this->redirect($this->generateUrl('account_teacher_courses'));
        }
        
        if($request->get('delete_schedule_item')) {
            if(in_array($teacher_owns_course['course_status'], $course_denied_statuses)) { // if the course has denied statuses block 
                $this->get('session')->setFlash('error', 'The course has "'.$teacher_owns_course['course_status'].'" status. You cannot change the schedule now.');
                return $this->redirect($this->generateUrl('account_teacher_course_schedule'));
            }
            
            
            $em->getRepository('FrontFrontBundle:CourseSchedule')->deleteScheduleItem($course_id, $request->get('delete_schedule_item'));
            
        }
        
        if ($request->getMethod() == 'POST') { // saving course schedule
            if(in_array($teacher_owns_course['course_status'], $course_denied_statuses)) { // if the course has denied statuses block 
                $this->get('session')->setFlash('error', 'The course has "'.$teacher_owns_course['course_status'].'" status. You cannot change the schedule now.');
                return $this->redirect($this->generateUrl('account_teacher_course_schedule'));
            }
            $schedule = $request->get('schedule');
            $course_schedule = $em->getRepository('FrontFrontBundle:CourseSchedule')->addCourseSchedule($course_id, $schedule);
            
            $this->get('session')->setFlash('notice', 'The schedule was saved.');
            return $this->redirect($this->generateUrl('account_teacher_course_schedule').'?course_id='.$course_id);
        }
        
        // course schedule
        $course_schedule = $em->getRepository('FrontFrontBundle:CourseSchedule')->getCourseSchedule($course_id);
        
        return $this->render('FrontFrontBundle:Account:Course/courses_schedule.html.twig', array('course_schedule' => $course_schedule, 'course_data' => $teacher_owns_course));
    }
    
    public function teacherScheduleAction() {
        if (!(Auth::isAuth() && Auth::getAuthParam('account_type')=='teacher')) {
            return $this->redirect($this->generateUrl('register'));
        }

        $em = $this->getDoctrine()->getEntityManager();
        $courses_schedule = $em->getRepository('FrontFrontBundle:Teachers')->getTeacherScheduleData(Auth::getAuthParam('id'));
        
        $formatted_data = \Front\FrontBundle\Libs\CommonLib::formatDataForSchedule($courses_schedule);
//        \Front\FrontBundle\Additional\Debug::d1($formatted_data);
        return $this->render('FrontFrontBundle:Account:Teacher/teacher_schedule.html.twig', array('teacher_schedule' => $formatted_data));
    }

}
