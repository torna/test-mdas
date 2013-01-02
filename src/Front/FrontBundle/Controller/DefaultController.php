<?php

namespace Front\FrontBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Front\FrontBundle\Security\Auth;

class DefaultController extends Controller {

    /**
     * homepage
     * @return type
     */
    public function indexAction() {
        return $this->render('FrontFrontBundle:Default:homepage.html.twig');
    }

    /**
     * list of teachers
     * @return type
     */
    public function techerListAction() {
        $em = $this->getDoctrine()->getEntityManager();
        $teacher_list = $em->getRepository('FrontFrontBundle:Teachers')->getTeachersWithObjects(true);
        return $this->render('FrontFrontBundle:Default:teacher_list.html.twig', array('teacher_list' => $teacher_list));
    }

    /**
     * list of courses
     * @return type
     */
    public function courseListAction() {
        $em = $this->getDoctrine()->getEntityManager();
        $object_id = $this->getRequest()->get('object_id');
        if(!is_numeric($object_id)) {
            $object_id = false;
        }
        $course_list = $em->getRepository('FrontFrontBundle:AvailableCourses')->getAvailableCourses($object_id);
        $system_objects = $em->getRepository('FrontFrontBundle:SystemObjects')->getObjects();
        
        $cnt = count($system_objects);
        $objects_and_cateogries = array();
        for ($i = 0; $i < $cnt; $i++) {
            $object_category = $system_objects[$i]['object_category_ro'];
            $objects_and_cateogries[$object_category][] = $system_objects[$i];
        }
        
        return $this->render('FrontFrontBundle:Default:course_list.html.twig', array('course_list' => $course_list, 'objects_and_cateogries' => $objects_and_cateogries));
    }

    /**
     * shows details of a course
     * @return type
     */
    public function courseDetailsAction() {
        $request = $this->getRequest();
        $course_id = $request->get('course_id');
        if (!is_numeric($course_id)) {
            $this->get('session')->setFlash('error', 'Wrong course id.');
            return $this->redirect($request->headers->get('referer'));
        }
        $em = $this->getDoctrine()->getEntityManager();
        $course_details = $em->getRepository('FrontFrontBundle:AvailableCourses')->getCourseById($course_id);
        if (empty($course_details)) {
            $this->get('session')->setFlash('error', 'The course doesn\'t exist.');
            return $this->redirect($request->headers->get('referer'));
        }

        $course_schedule = $em->getRepository('FrontFrontBundle:CourseSchedule')->getCourseSchedule($course_details['id']);
        $teacher_details = $em->getRepository('FrontFrontBundle:Teachers')->getTeachersWithObjects(true, $course_details['teacher_id']);

        $is_student_enrolled_on_course = false;
        if (Auth::isAuth() && Auth::getAuthParam('account_type') == 'student') {
            $is_student_enrolled_on_course = $em->getRepository('FrontFrontBundle:Students')->isEnrolledOnCourse(Auth::getAuthParam('id'), $course_details['id']);
            $enroll_url = $this->generateUrl('enroll') . '?course_id=' . $course_id;
        } else {
            $enroll_url = $this->generateUrl('register') . '?next_url=' . urlencode($this->generateUrl('enroll') . '?course_id=' . $course_id);
        }

//        \Front\FrontBundle\Additional\Debug::d1($teacher_details);
        return $this->render('FrontFrontBundle:Default:course_details.html.twig', array(
                    'course_details' => $course_details,
                    'teacher_details' => $teacher_details[0],
                    'course_schedule' => $course_schedule,
                    'is_student_enrolled_on_course' => !empty($is_student_enrolled_on_course),
                    'enroll_url' => $enroll_url,
                ));
    }

    /**
     * shows captcha
     */
    public function captchaAction() {
        /*
          we create out image from the existing jpg image.
          You can replace that image with another of the
          same size.
         */
        $img = imagecreatefromjpeg("img/texture.jpg");
        /*
          defines the text we use in our image,
          in our case the security number defined
          in index.php
         */

        $str = 'qwertyuiopasdfghjklzxcvbnm1234567890';
        $str = str_shuffle($str);
        $rand = rand(0, strlen($str) - 5);
        $final_string = substr($str, $rand, 5);

        $this->get('session')->set('security_number', $final_string);
        $security_number = $final_string;
//        $security_number = empty($_SESSION['security_number']) ? 'error' : $_SESSION['security_number'];
        $image_text = $security_number;
        /*
          we define 3 random numbers that will
          eventually create our text color code (RGB)
         */
        $red = rand(100, 255);
        $green = rand(100, 255);
        $blue = rand(100, 255);
        /*
          in order to have different color for our text,
          we substract from the maximum 255 the random
          number generated above
         */
        $text_color = imagecolorallocate($img, 255 - $red, 255 - $green, 255 - $blue);
        /*
          this adds the text stored in $image_text to our
          capcha image
         */
        $text = imagettftext($img, 16, rand(-10, 10), rand(10, 30), rand(25, 35), $text_color, "fonts/courbd.ttf", $image_text);
        /*
          we tell the browser that he's dealing
          with a jpg image, although that's not true,
          he will have to belive us
         */
        header("Content-type:image/jpeg");
        header("Content-Disposition:inline ; filename=secure.jpg");
        imagejpeg($img);
        die;
    }

}
