<?php

namespace Front\FrontBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Front\FrontBundle\Security\Auth;

class AjaxController extends Controller {

    public function indexAction() {
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();
        $todo = $request->get('todo');
        switch($todo) {
            case 'get_board':
                if (Auth::isAuth()) {
                    $board = $request->get('board');
                    if($board == 'programming') {
                        return $this->render('FrontFrontBundle:Ajax:board_wb3.html.twig');
                    } elseif($board == 'languages') {
                        return $this->render('FrontFrontBundle:Ajax:board_wb2.html.twig');
                    } elseif($board == 'draw') {
                        return $this->render('FrontFrontBundle:Ajax:board_wb1.html.twig');
                    }
                }
                break;
            case 'get_wb3_generic':
                if (Auth::isAuth()) {
                    return $this->render('FrontFrontBundle:Ajax:_wb3_generic_content.html.twig');
                }
                break;
        }
    }

}
