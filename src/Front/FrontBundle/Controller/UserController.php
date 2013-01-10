<?php

namespace Front\FrontBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Front\FrontBundle\Security\Auth as Auth;

/**
 * User controller.
 *
 */
class UserController extends Controller {

    protected $user_repositories = array('student' => 'Students', 'teacher' => 'Teachers');

    public function registerAction() {
        return $this->render('FrontFrontBundle:Default:login_register.html.twig');
    }

    public function logoutAction() {
        Auth::setAuth(false);
        return $this->redirect($this->generateUrl('homepage'));
    }

    /**
     * "registration process"
     * @return type
     * routing execute_register_1
     */
    public function registerStep2Action() {
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();

        $allowed_registration_types = array('student', 'teacher');

        $email = $request->get('register_email');
        $pass = $request->get('register_pass');
        $repass = $request->get('register_repass');
        $registration_type = $request->get('registration_type');
        $captcha = $request->get('captcha');


        if (!in_array($registration_type, $allowed_registration_types)) {
            $this->get('session')->setFlash('error', 'Please choose a correct registration type.');
            return $this->redirect($this->generateUrl('register'));
        }

        $email_exists = $em->getRepository('FrontFrontBundle:Students')->checkEmailExists($email);
        if (!preg_match("^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$^", $email)) {
            $this->get('session')->setFlash('error', 'The email "' . $email . '" is not a valid email.');
            return $this->redirect($this->generateUrl('register'));
        }


        if ($email_exists) {
            $this->get('session')->setFlash('error', 'The email "' . $email . '" is already registered in our database. If you forgot your password please use "Restore password" function.');
            return $this->redirect($this->generateUrl('register'));
        }

        if (strlen($pass) < 6) {
            $this->get('session')->setFlash('error', 'The lenght is too short. Please use a password with a length not less than 6 caracters.');
            return $this->redirect($this->generateUrl('register'));
        }

        if ($pass != $repass) {
            $this->get('session')->setFlash('error', 'Your password does not match.');
            return $this->redirect($this->generateUrl('register'));
        }
        if ($captcha != $this->get('session')->get('security_number')) {
            $this->get('session')->setFlash('error', 'The security code was invalid.');
            return $this->redirect($this->generateUrl('register'));
        }

        $user_data = $em->getRepository('FrontFrontBundle:' . $this->getUserRepository($registration_type))->createUser($email, $pass);

        $this->sendActivationEmail($email, $user_data[':activation_hash']);

        return $this->render('FrontFrontBundle:User:thankyou.html.twig');
    }

    protected function getUserRepository($ident) {
        return $this->user_repositories[$ident];
    }

    /**
     * sends activation email
     * @param string $email
     * @param string $activation_hash
     */
    private function sendActivationEmail($email, $activation_hash) {
        $headers = 'MIME-Version: 1.0' . "\r\n";
        $headers .= 'Content-type: text/html; charset=utf-8' . "\r\n";
        $headers .= 'From: learn.md <noreply@learn.md>' . "\r\n";

        echo $this->renderView('FrontFrontBundle:Emails:email_confirmation.html.twig', array('activation_link' => 'http://www.learn.md/activate-email?hash=' . $activation_hash));
        die;

        // Mail it
        mail($email, 'learn.md - email de confirmare', $this->renderView('FrontFrontBundle:Emails:email_confirmation.html.twig', array('activation_link' => 'http://www.learn.md/activate-email?hash=' . $activation_hash)), $headers);
        return;
        $message = \Swift_Message::newInstance()
                ->setSubject('SEOwatchman.com - email confirmation')
                ->setFrom('noreply@seowatchman.com')
                ->setTo($email)
                ->setBody($this->renderView('FrontFrontBundle:Emails:email_confirmation.html.twig', array('activation_link' => 'http://www.seowatchman.com/activate-email?hash=' . $activation_hash)))
        ;
        $this->get('mailer')->send($message);
    }

    private function sendPasswordEmail($email, $password) {
        $headers = 'MIME-Version: 1.0' . "\r\n";
        $headers .= 'Content-type: text/html; charset=utf-8' . "\r\n";
        $headers .= 'From: learn.md <noreply@learn.md>' . "\r\n";

//        echo $this->renderView('FrontFrontBundle:Emails:password_recovery.html.twig', array('email' => $email, 'password' => $password));die;
        // Mail it
        mail($email, 'learn.md - password recovery', $this->renderView('FrontFrontBundle:Emails:password_recovery.html.twig', array('email' => $email, 'password' => $password)), $headers);
        return;
        $message = \Swift_Message::newInstance()
                ->setSubject('SEOwatchman.com - password recovery')
                ->setFrom('noreply@seowatchman.com')
                ->setTo($email)
                ->setBody($this->renderView('FrontFrontBundle:Emails:password_recovery.html.twig', array('email' => $email, 'password' => $password)))
        ;
        $this->get('mailer')->send($message);
    }

    /**
     * "activate email" page
     * @return type
     * routing email_activation
     */
    public function activateEmailAction() {
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();
        $hash = $request->get('hash');
        $hash_exists = $em->getRepository('FrontFrontBundle:Students')->checkHashExists($hash);
        if ($hash_exists['hash_exists']) {
            $em->getRepository('FrontFrontBundle:Students')->actiavateHash($hash);
            $message = 'Your account had been activated';
        } else {
            $message = 'The hash does not exist. Your account might be activated. If you had registered more than 30 days ago without activating the email then your email is deleted from our database. Please register one more time.';
        }
        return $this->render('FrontFrontBundle:User:email_activation.html.twig', array('message' => $message));
    }

    /**
     * "resend activation email" page
     * @return type
     * routing resend_activation_hash
     */
    public function resendActivationEmailAction() {
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();

        if ($request->getMethod() == 'POST') {
            $email = $request->get('email');
            if (!preg_match("^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$^", $email)) {
                $this->get('session')->setFlash('error', 'The security code was invalid.');
                return $this->redirect($this->generateUrl('resend_activation_hash'));
            }
            $secret_hash = $em->getRepository('FrontFrontBundle:Students')->getSecretHashByEmail($email);

            if (empty($secret_hash)) { // if user is deleted or doesnt exist at all
                $this->get('session')->setFlash('error', 'This email does not exist in our database. Please register.');
                return $this->redirect($this->generateUrl('resend_activation_hash'));
            }
            if ($secret_hash['is_activated'] == 1) { // if user already had activated the email
                $this->get('session')->setFlash('error', 'You do not need activation email because your accound is active. If you think you lost your password please use "Password recovery" function.');
                return $this->redirect($this->generateUrl('resend_activation_hash'));
            }
            $this->sendActivationEmail($email, $secret_hash['activation_hash']);
            $this->get('session')->setFlash('notice', 'The activation email had been send to you. Please check "spam" folder also.');
            return $this->redirect($this->generateUrl('resend_activation_hash'));
        }
        return $this->render('FrontFrontBundle:User:resend_activation_email.html.twig');
    }

    /**
     * "password recovery" page
     */
    public function passwordRecoveryAction() {
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();

        if ($request->getMethod() == 'POST') {
            $email = $request->get('email');
            if (!preg_match("^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$^", $email)) {
                $this->get('session')->setFlash('error', 'The email you provided (' . $email . ') is invalid.');
                return $this->redirect($this->generateUrl('password_recovery'));
            }
            $data = $em->getRepository('FrontFrontBundle:Students')->getPasswordByEmail($email);
            if (@$data['is_deleted'] == 1 || empty($data)) { // if user is deleted or doesnt exist at all
                $this->get('session')->setFlash('error', 'This email does not exist in our database. Please register.');
                return $this->redirect($this->generateUrl('password_recovery'));
            }
            if ($data['is_activated'] == 0) { // if user already had activated the email
                $this->get('session')->setFlash('error', 'Your email is in our database but you didn\'t activate it. Please open the email you received from us and click the activation link. <i>If you did not receive the email please user "Resend activation code".</i>');
                return $this->redirect($this->generateUrl('password_recovery'));
            }

            $this->sendPasswordEmail($email, $data['pass']);
            $this->get('session')->setFlash('notice', 'The has has been send to your email. Please check "spam" folder also.');
            return $this->redirect($this->generateUrl('password_recovery'));
        }
        return $this->render('FrontFrontBundle:User:password_recovery.html.twig');
    }

    /**
     * "executes login"
     * routing execute_login
     */
    public function executeLoginAction() {
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();
        if ($request->getMethod() != 'POST') {
            return $this->redirect($this->generateUrl('register'));
        }
        $login_email = $request->get('login_email');
        $login_pass = $request->get('login_pass');

        if ($login_pass == '') {
            $this->get('session')->setFlash('error', 'Please provide a password.');
            return $this->redirect($this->generateUrl('execute_login'));
        }

        if (!preg_match("^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$^", $login_email)) {
            $this->get('session')->setFlash('error', 'The email you provided (' . $login_email . ') is invalid.');
            return $this->redirect($this->generateUrl('register'));
        }

        $data = $em->getRepository('FrontFrontBundle:Students')->getUserAuth($login_email, $login_pass);

        if (empty($data) || $data['is_deleted'] == 1) {
            $this->get('session')->setFlash('error', 'User with such combination of email/password does not exist in our database.');
            return $this->redirect($this->generateUrl('register'));
        }

        if ($data['is_activated'] == 0) {
            $this->get('session')->setFlash('error', 'Your email is in our database but you didnt activate it. Please open the email you received from us and click the activation link. <i>If you did not receive the email please user "Resend activation code".</i>');
            return $this->redirect($this->generateUrl('register'));
        }

        Auth::setAuth();
        Auth::setAuthParam('id', $data['id']);
        Auth::setAuthParam('f_name', $data['f_name']);
        Auth::setAuthParam('l_name', $data['l_name']);
        Auth::setAuthParam('account_type', $data['account_type']);
        Auth::setAuthParam('pass', $login_pass);

        $em->getRepository('FrontFrontBundle:' . $this->getUserRepository($data['account_type']))->updateLastLogin($data['id']);

        if ($data['has_completed_profile'] == 0) { // logins first time and did not complete profile
            return $this->redirect($this->generateUrl('register_step_3'));
        }

        if($request->get('next_url') && $data['account_type'] == 'student') {
            return $this->redirect($request->get('next_url'));
        }
        
        return $this->redirect($this->generateUrl('account_'.$data['account_type']));
    }

    /**
     * "registration step3" page (user loggs in first time)
     * routing register_step_3
     */
    public function registerStep3Action() {
        if (!Auth::isAuth()) {
            return $this->redirect($this->generateUrl('login_register'));
        }
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();
        if ($request->getMethod() == 'POST') {
            $params = array();
            $params['f_name'] = $request->get('f_name');
            $params['l_name'] = $request->get('l_name');
            $params['age'] = $request->get('age', 0);
            $params['city'] = $request->get('city');
            $params['home_phone'] = $request->get('home_phone');
            $params['mobile_phone'] = $request->get('mobile_phone');
            $params['description'] = $request->get('description');
            $params['address'] = $request->get('address');

            $params['photo'] = $this->handleUploadedPhoto();

            if (empty($params['f_name']) || empty($params['l_name']) || !is_numeric($params['age']) || empty($params['city']) || empty($params['mobile_phone']) || empty($params['address'])) {
                $this->get('session')->setFlash('error', 'Please fill all required fields.');
                return $this->redirect($this->generateUrl('register_step_3'));
            }

            $em->getRepository('FrontFrontBundle:' . $this->getUserRepository(Auth::getAuthParam('account_type')))->addUserData(Auth::getAuthParam('id'), $params);
            $em->getRepository('FrontFrontBundle:' . $this->getUserRepository(Auth::getAuthParam('account_type')))->setHasCompletedProfile(Auth::getAuthParam('id'), Auth::getAuthParam('account_type'));

            return $this->redirect($this->generateUrl('account_'.Auth::getAuthParam('account_type')));
        }
        return $this->render('FrontFrontBundle:User:register_step2_' . Auth::getAuthParam('account_type') . '.html.twig');
    }

    protected function handleUploadedPhoto() {
        $allowed_file_types = array(
            'image/gif', // Opera, Moz, MSIE
            'image/jpeg', // Opera, Moz
            'image/png', // Opera, Moz
            'image/pjpeg', // MSIE
            'image/x-png'  // MSIE
        );
        
        if ($this->get('request')->files->get('photo')) {
            $photo_name = '';
            
            if (!in_array($this->get('request')->files->get('photo')->getMimeType(), $allowed_file_types)) {
                return $photo_name;
            }
            $filename = $this->get('request')->files->get('photo')->getClientOriginalName();
            $explode = explode('.', $filename);
            $extension = $explode[count($explode) - 1];
            unset($explode);
            $rand = md5(rand(1, 99) . time());

            $photo_name = $rand . '.' . $extension;
            $this->get('request')->files->get('photo')->move('uploads', $photo_name);
            $image = new \Front\FrontBundle\Extra\SimpleImage();
            $image->load('uploads/' . $photo_name);
            $image->resize(200, 250, false, false);
            $image->save('uploads/th_' . $photo_name);
            return $photo_name;
        }
    }

    /**
     * "registration step3" page (user loggs in first time)
     * routing register_step_3
     */
    public function settingsAction() {
        if (!Auth::isAuth()) {
            return $this->redirect($this->generateUrl('login_register'));
        }
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();

        if ($request->getMethod() == 'POST') {
            $todo = $request->get('todo');

            switch ($todo) {
                case 'change_pass':
                    $old_pass = $request->get('old_pass');
                    if ($old_pass != Auth::getAuthParam('pass')) {
                        $this->get('session')->setFlash('error', 'The old password is incorrect.');
                        return $this->redirect($request->headers->get('referer'));
                    }
                    $new_pass = $request->get('new_pass');
                    $renew_pass = $request->get('renew_pass');
                    if ($new_pass != $renew_pass) {
                        $this->get('session')->setFlash('error', 'The new passwords do not match.');
                        return $this->redirect($request->headers->get('referer'));
                    }
                    if (strlen($new_pass) < 6) {
                        $this->get('session')->setFlash('error', 'The new password is too short. It must be equal or greather than 6 caracters.');
                        return $this->redirect($request->headers->get('referer'));
                    }
                    $em->getRepository('FrontFrontBundle:User')->updateUserPassword(Auth::getAuthParam('id'), $new_pass);
                    Auth::setAuthParam('pass', $new_pass);
                    $this->get('session')->setFlash('notice', 'The password was successfully changed.');
                    return $this->redirect($request->headers->get('referer'));
                    break;
                case 'delete_account':
                    $delete_code = $request->get('delete_code');
                    if ($delete_code != 'delete my account') {
                        $this->get('session')->setFlash('error', 'Wrong string. Please use "delete my account" to delete your account.');
                        return $this->redirect($request->headers->get('referer'));
                    }
                    $em->getRepository('FrontFrontBundle:User')->deleteAllUserData(Auth::getAuthParam('id'));

                    break;
            }


            return $this->redirect($this->generateUrl('dashboard'));
        }

        return $this->render('FrontFrontBundle:Account/User:user_settings.html.twig', array('date_format' => Auth::getAuthParam('date_format')));
    }
    
    public function preCourseAction() {
        if (!Auth::isAuth()) {
            return $this->redirect($this->generateUrl('register'));
        }
        
        $request = $this->getRequest();
        
        $course_id = $request->get('course_id');
        if(!is_numeric($course_id)) {
            $this->get('session')->setFlash('error', 'Wrong course id.');
            return $this->redirect($request->headers->get('referer'));
        }

        $em = $this->getDoctrine()->getEntityManager();
        // check if course is about to start
        $course_started = $em->getRepository('FrontFrontBundle:AvailableCourses')->getCheckIfCourseIsStarted($course_id);
        if(!$course_started && 0) {
            $this->get('session')->setFlash('error', 'This course did not start yet.');
            return $this->redirect($request->headers->get('referer'));
        }
        
        $course_details = $em->getRepository('FrontFrontBundle:AvailableCourses')->getCourseById($course_id);
        
        return $this->render('FrontFrontBundle:Account/Course:pre_course.html.twig', array('course_details' => $course_details));
    }
    
    public function redirectToClassroomAction() {
        if (!Auth::isAuth()) {
            return $this->redirect($this->generateUrl('register'));
        }
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();
        
        $course_id = $request->get('course_id');
        if(!is_numeric($course_id)) {
            $this->get('session')->setFlash('error', 'Wrong course id.');
            return $this->redirect($request->headers->get('referer'));
        }
        $is_teacher = 0;
        $token = md5(Auth::getAuthParam('account_type').Auth::getAuthParam('id').$course_id.rand(1,500));
        if(Auth::getAuthParam('account_type') == 'student') {
            // check if user is enrolled on this course, and if he had payed
            $enroll_status = $em->getRepository('FrontFrontBundle:Enrolled')->checkIfEnrolledAndPayed(Auth::getAuthParam('id'), $course_id);
            if(empty($enroll_status)) { // the user is not enrolled or did not pay the course
                $this->get('session')->setFlash('error', 'Error: You did not enroll on this course OR you didn\'t pay for it.');
                return $this->redirect($request->headers->get('referer'));
            }
        } elseif(Auth::getAuthParam('account_type') == 'teacher') {
            $is_teacher = 1;
            // check if teacher owns this course
            $course_data = $em->getRepository('FrontFrontBundle:AvailableCourses')->getCourseTeacherByCourseId(Auth::getAuthParam('id'), $course_id);
            if(empty($course_data)) { // the user is not enrolled or did not pay the course
                $this->get('session')->setFlash('error', 'Error: You do not own this course.');
                return $this->redirect($request->headers->get('referer'));
            }
        }
        $em->getRepository('FrontFrontBundle:AvailableCourses')->storeUserToken(Auth::getAuthParam('id'), $course_id, $token, $is_teacher);
        return $this->redirect($this->generateUrl('account_ongoing_course').'?token='.$token.'&course_id='.$course_id);
    }

}
