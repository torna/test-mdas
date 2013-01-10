<?php

namespace Front\FrontBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Front\FrontBundle\Security\Auth;

class OngoingCourseController extends Controller {

    public function classroomAction() {
        if (!Auth::isAuth()) {
            return $this->redirect($this->generateUrl('register'));
        }
        // check if token is valid
        $request = $this->getRequest();
        $token = $request->get('token');
        if(!$token) {
            die('No token provided.');
        }
        
        $course_id = $request->get('course_id');
        if(!is_numeric($course_id)) {
            $this->get('session')->setFlash('error', 'Wrong course id.');
            
            if(Auth::getAuthParam('account_type') == 'student') {
                return $this->redirect($this->generateUrl ('account_student_courses'));
            } elseif(Auth::getAuthParam('account_type') == 'teacher') {
                return $this->redirect($this->generateUrl ('account_teacher_courses'));
            }
        }
        
        $is_teacher = 0;
        if(Auth::getAuthParam('account_type') == 'teacher') {
            $is_teacher = 1;
        }
        
        $em = $this->getDoctrine()->getEntityManager();
        $is_valid_token = $em->getRepository('FrontFrontBundle:AvailableCourses')->checkTokenValid(Auth::getAuthParam('id'), $token, $is_teacher);
        if(empty($is_valid_token)) {
            return $this->redirect($this->generateUrl('account_redirect_ongoing_course').'?course_id='.$course_id);
        }
        
        return $this->render('FrontFrontBundle:Account/Course:ongoing_course.html.twig', array('token' => $token));
        
    }

}
