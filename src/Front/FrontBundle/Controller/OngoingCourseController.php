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
        
        $is_teacher = 0;
        if(Auth::getAuthParam('account_type') == 'teacher') {
            $is_teacher = 1;
        }
        
        $em = $this->getDoctrine()->getEntityManager();
        $is_valid_token = $em->getRepository('FrontFrontBundle:AvailableCourses')->checkTokenValid(Auth::getAuthParam('id'), $token, $is_teacher);
        if(empty($is_valid_token)) {
            die('No access to this course.');
        }
        
        
        
    }

}
