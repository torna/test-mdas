<?php

namespace Front\FrontBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Front\FrontBundle\Security\Auth as Auth;

/**
 * Student controller.
 *
 */
class StudentController extends Controller {

    public function accountAction() {
        if (!(Auth::isAuth() && Auth::getAuthParam('account_type')=='student')) {
            return $this->redirect($this->generateUrl('register'));
        }
        
        return $this->render('FrontFrontBundle:Account:Student/account_home.html.twig', array());
    }
    
    
    public function studentCoursesAction() {
        if (!(Auth::isAuth() && Auth::getAuthParam('account_type')=='student')) {
            return $this->redirect($this->generateUrl('register'));
        }
        
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();
        
        if($request->get('delete_course_id')) { // deleting a course
            // check if student is enrolled
            $is_enrolled = $em->getRepository('FrontFrontBundle:Students')->isEnrolledOnCourse(Auth::getAuthParam('id'), $request->get('delete_course_id'));
            if(empty($is_enrolled)) {
                $this->get('session')->setFlash('error', 'You are not enrolled on this course.');
                return $this->redirect($this->generateUrl('account_student_courses'));
            }
            $course_data = $em->getRepository('FrontFrontBundle:AvailableCourses')->getCourseById($request->get('delete_course_id'));
            if(empty($course_data)) { // teacher does not own this course
                die('Error ajsd7f');
            }
            
            if($is_enrolled['is_payed']) {
                if($course_data['course_status'] == 'waiting') { // if student payed for the course and un-enrolls before the course begins we return money to him -10%
                    // set enroll as deleted
                    $em->getRepository('FrontFrontBundle:Enrolled')->setEnrollDeleted(Auth::getAuthParam('id'), $request->get('delete_course_id'));
                    
                    /**
                     * put money back -10%
                     * @TODO
                     */
                }
                if($course_data['course_status'] == 'ongoing') { // if student payed for the course and un-enrolls when the course is ongoing he loses all the money
                    // set enroll as deleted
                    $em->getRepository('FrontFrontBundle:Enrolled')->setEnrollDeleted(Auth::getAuthParam('id'), $request->get('delete_course_id'));
                }
            } else {
                // un-enroll
                $em->getRepository('FrontFrontBundle:Enrolled')->setUnEnroll(Auth::getAuthParam('id'), $request->get('delete_course_id'));
            }
            
            $this->get('session')->setFlash('notice', 'Un-enrolled successfully.');
            return $this->redirect($request->headers->get('referer'));
        }
        
        $student_courses = $em->getRepository('FrontFrontBundle:Enrolled')->getStudentCourses(Auth::getAuthParam('id'));
//        \Front\FrontBundle\Additional\Debug::d1($student_courses);
        
        return $this->render('FrontFrontBundle:Account:Course/student_courses.html.twig', array('student_courses' => $student_courses));
    }
    
    public function enrollAction() {
        if (!(Auth::isAuth() && Auth::getAuthParam('account_type')=='student')) {
            return $this->redirect($this->generateUrl('register'));
        }
        $request = $this->getRequest();
        $course_id = $request->get('course_id');
        if(!is_numeric($course_id)) {
            $this->get('session')->setFlash('error', 'Wrong course id provided.');
            return $this->redirect($request->headers->get('referer'));
        }
        $em = $this->getDoctrine()->getEntityManager();
        $course_data = $em->getRepository('FrontFrontBundle:AvailableCourses')->getCourseById($course_id);
        if(empty($course_data)) { // teacher does not own this course
            die('Error gjakgyy4');
        }
        
        if($course_data['course_status'] != 'waiting') { // check if course is in 'waiting' status
            $this->get('session')->setFlash('error', 'You cannot enroll on this course. It has finished or is ongoing.');
            return $this->redirect($request->headers->get('referer'));
        }
        
        if($course_data['cnt_enrolled'] == $course_data['max_nr_students']) {
            $this->get('session')->setFlash('error', 'You cannot enroll on this course. It has reached maximum count of students.');
            return $this->redirect($request->headers->get('referer'));
        }
        
        $em->getRepository('FrontFrontBundle:Enrolled')->enroll(Auth::getAuthParam('id'), $course_id);
        
        $this->get('session')->setFlash('notice', 'Enrolled successfully.');
        return $this->redirect($request->headers->get('referer'));
        
        
    }
    
    public function studentScheduleAction() {
        if (!(Auth::isAuth() && Auth::getAuthParam('account_type')=='student')) {
            return $this->redirect($this->generateUrl('register'));
        }
        $em = $this->getDoctrine()->getEntityManager();
        $courses_schedule = $em->getRepository('FrontFrontBundle:Students')->getStudentScheduleData(Auth::getAuthParam('id'));
        
        $formatted_data = \Front\FrontBundle\Libs\CommonLib::formatDataForSchedule($courses_schedule);
        return $this->render('FrontFrontBundle:Account:Student/student_schedule.html.twig', array('student_schedule' => $formatted_data));
    }

}
