<?php

namespace Front\FrontBundle\Security;
use Symfony\Component\HttpFoundation\Session\Session as Session;

class Auth {

    static private $_not_allowed_params = array('login_status');

    static public function setAuth($status = true) {
        $session =  new Session();
        if ($status) {
            $session->set('login_status', 'in');
//            $_SESSION['learn']['auth']['login_status'] = 'in';
        } else {
            $session->set('login_status', NULL);
//            unset($_SESSION['learn']['auth']);
        }
        
    }

    static public function isAuth() {
        $session =  new Session();
        return $session->get('login_status') == 'in';
//        return @$_SESSION['learn']['auth']['login_status'] == 'in';
    }

    static public function setAuthParam($param_name, $param_value) {
        if (in_array($param_name, self::$_not_allowed_params)) {
            throw new Exception('Param not allowed');
        }
        $session =  new Session();
        $params = $session->get('learn');
        $params['auth'][$param_name] = $param_value;
        $session->set('learn', $params);
//        $_SESSION['learn']['auth'][$param_name] = $param_value;
    }

    static public function getAuthParam($param_name) {
        $session =  new Session();
        $params = $session->get('learn');
        return @$params['auth'][$param_name];
//        return @$_SESSION['learn']['auth'][$param_name];
    }

}

?>
