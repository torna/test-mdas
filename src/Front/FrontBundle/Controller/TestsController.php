<?php

namespace Front\FrontBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Front\FrontBundle\Security\Auth;

class TestsController extends Controller {

    public function teacherTestsAction() {
        if (!(Auth::isAuth() && Auth::getAuthParam('account_type') == 'teacher')) {
            return $this->redirect($this->generateUrl('register'));
        }

        $modify_data = array();
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();

        if ($request->getMethod() == 'POST') { // saving test
            $test_name_public = $request->get('test_name_public');
            $test_name_private = $request->get('test_name_private');
            $test_desc = $request->get('test_desc');
            $test_type = $request->get('test_type');

            if (empty($test_name_public) || empty($test_name_private) || empty($test_desc) || !in_array($test_type, array('quiz', 'placeholder'))) {
                $this->get('session')->setFlash('error', 'Please fill all required fields.');
                return $this->redirect($this->generateUrl('account_teacher_tests'));
            }
            $test_id = $request->get('test_id');
            if (is_numeric($test_id)) { // is update
                // check if teacher owns the test
                $test_details = $em->getRepository('FrontFrontBundle:TeacherTests')->getTeacherTestDetails(Auth::getAuthParam('id'), $test_id);
                if (empty($test_details)) { // teacher does not own the presentation
                    $this->get('session')->setFlash('error', 'You do not own this test.');
                    return $this->redirect($this->generateUrl('account_teacher_tests'));
                }
                $em->getRepository('FrontFrontBundle:TeacherTests')->updateTest(Auth::getAuthParam('id'), $test_id, $test_name_public, $test_name_private, $test_desc, $test_type);
                $this->get('session')->setFlash('notice', 'The test was updated successfully.');
            } else {
                $test_id = $em->getRepository('FrontFrontBundle:TeacherTests')->createTest(Auth::getAuthParam('id'), $test_name_public, $test_name_private, $test_desc, $test_type);
                $this->get('session')->setFlash('notice', 'The presentation was created successfully. You can now create questions for this test.');
            }

            return $this->redirect($this->generateUrl('account_teacher_tests'));
        }

        if ($request->get('todo')) {
            $test_id = $request->get('test_id');
            if (!is_numeric($test_id)) {
                $this->get('session')->setFlash('error', 'Wrong presentation id.');
                return $this->redirect($this->generateUrl('account_teacher_presentations'));
            }

            $test_details = $em->getRepository('FrontFrontBundle:TeacherTests')->getTeacherTestDetails(Auth::getAuthParam('id'), $test_id);
            if (empty($test_details)) { // teacher does not own the test
                $this->get('session')->setFlash('error', 'You do not own this test.');
                return $this->redirect($this->generateUrl('account_teacher_tests'));
            }

            switch ($request->get('todo')) {
                case 'delete':
                    $em->getRepository('FrontFrontBundle:TeacherTests')->deleteTest(Auth::getAuthParam('id'), $test_id);
                    $this->get('session')->setFlash('notice', 'Presentation deleted successfully.');
                    return $this->redirect($this->generateUrl('account_teacher_tests'));
                case 'modify':
                    $modify_data = $test_details;
                    break;
            }
        }
        $test_list = $em->getRepository('FrontFrontBundle:TeacherTests')->getTeacherTests(Auth::getAuthParam('id'));

        return $this->render('FrontFrontBundle:Account:Teacher/teacher_test_list.html.twig', array('test_list' => $test_list, 'modify_data' => $modify_data));
    }

    public function teacherTestQuestionsAction() {
        if (!(Auth::isAuth() && Auth::getAuthParam('account_type') == 'teacher')) {
            return $this->redirect($this->generateUrl('register'));
        }
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();

        $test_id = $request->get('test_id');
        if (!is_numeric($test_id)) {
            $this->get('session')->setFlash('error', 'Wrong test id.');
            return $this->redirect($this->generateUrl('account_teacher_tests'));
        }

        // check if teacher owns the test
        $test_details = $em->getRepository('FrontFrontBundle:TeacherTests')->getTeacherTestDetails(Auth::getAuthParam('id'), $test_id);
        if (empty($test_details)) { // teacher does not own the test
            $this->get('session')->setFlash('error', 'You do not own this test.');
            return $this->redirect($this->generateUrl('account_teacher_tests'));
        }

        $test_questions = $em->getRepository('FrontFrontBundle:TeacherTestQuestions')->getTestQuestions(Auth::getAuthParam('id'), $test_id);
        $cnt = count($test_questions);

        $question_ids = array();
        for ($i = 0; $i < $cnt; $i++) {
            $question_ids[] = $test_questions[$i]['id'];
        }
        $todo_post = $request->get('todo_post');
        if ($request->getMethod() == 'POST') {
            switch ($todo_post) {
                case 'save_order':
                    $item_order = $request->get('order');
                    foreach ($item_order as $question_id => $order) {
                        if (in_array($question_id, $question_ids)) {
                            $em->getRepository('FrontFrontBundle:TeacherTestQuestions')->updateQuestionOrder($question_id, $order);
                        }
                    }
                    $this->get('session')->setFlash('notice', 'Order update successfully.');
                    return $this->redirect($request->headers->get('referer'));
                case 'save_question':
                    $question_type = $request->get('question_type');
                    if(!in_array($question_type, array('radio', 'text', 'checkboxes'))) {
                        $this->get('session')->setFlash('error', 'Wrong question type.');
                        return $this->redirect($request->headers->get('referer'));
                    }
                    
                    $question = $request->get('question');
                    $question_order = $request->get('question_order', 0);
                    if(empty($question)) {
                        $this->get('session')->setFlash('error', 'Please provide a question.');
                        return $this->redirect($request->headers->get('referer'));
                    }
                    
                    $question_id = $request->get('question_id');
                    if(!is_numeric($question_id)) {
                        $question_id = 0;
                    } else {
                        if(!in_array($question_id, $question_ids)) {
                            $this->get('session')->setFlash('error', 'You do not own this question.');
                            return $this->redirect($request->headers->get('referer'));
                        }
                    }
                    
                    $answers = $request->get($question_type.'_options');
                    $answers_order = $request->get($question_type.'_options_order');
                    $question_id = $em->getRepository('FrontFrontBundle:TeacherTestQuestions')->createQuestion($test_id, $question_id, $question, $question_type, $question_order);
                    $em->getRepository('FrontFrontBundle:TeacherQuestionOptions')->createQuestionAnswers($question_id, $answers, $answers_order);
//                    \Front\FrontBundle\Additional\Debug::d1($question_id);
                    $this->get('session')->setFlash('notice', 'Question created/updated successfully.');
                    return $this->redirect($this->generateUrl('account_teacher_test_questions').'?test_id='.$test_id);
            }
        }
        
        $todo = $request->get('todo');
        if ($todo == 'delete') {
            $question_id = $request->get('question_id');
            if(!is_numeric($question_id)) {
                $this->get('session')->setFlash('error', 'Wrong question id.');
                return $this->redirect($request->headers->get('referer'));
            }
            if(in_array($question_id, $question_ids)) {
                $em->getRepository('FrontFrontBundle:TeacherTestQuestions')->deleteQuestionById($question_id);
            }
            $this->get('session')->setFlash('notice', 'Question deleted successfully.');
            return $this->redirect($request->headers->get('referer'));
        }

        $modify_data = array();
        if ($todo == 'modify') {
            $question_id = $request->get('question_id');
            if(!is_numeric($question_id)) {
                $this->get('session')->setFlash('error', 'Wrong question id.');
                return $this->redirect($request->headers->get('referer'));
            }
            
            $modify_data['question_data'] = $em->getRepository('FrontFrontBundle:TeacherTestQuestions')->getQuestionIdByTeacherId(Auth::getAuthParam('id'), $question_id);
            $modify_data['answers'] = $em->getRepository('FrontFrontBundle:TeacherQuestionOptions')->getQuestionOptionsByTeacherId(Auth::getAuthParam('id'), $question_id);
//            \Front\FrontBundle\Additional\Debug::d1($modify_data);
        }

        return $this->render('FrontFrontBundle:Account:Teacher/teacher_test_questions.html.twig', array('test_details' => $test_details, 'test_questions' => $test_questions, 'modify_data' => $modify_data));
    }
    
    public function previewTestAction() {
        if (!(Auth::isAuth() && Auth::getAuthParam('account_type') == 'teacher')) {
            return $this->redirect($this->generateUrl('register'));
        }
        $request = $this->getRequest();
        
        $test_id = $request->get('test_id');
        
        if (!is_numeric($test_id)) {
            $this->get('session')->setFlash('error', 'Wrong test id.');
            return $this->redirect($this->generateUrl('account_teacher_tests'));
        }
        $em = $this->getDoctrine()->getEntityManager();

        // check if teacher owns the test
        $test_details = $em->getRepository('FrontFrontBundle:TeacherTests')->getTeacherTestDetails(Auth::getAuthParam('id'), $test_id);
        if (empty($test_details)) { // teacher does not own the test
            $this->get('session')->setFlash('error', 'You do not own this test.');
            return $this->redirect($this->generateUrl('account_teacher_tests'));
        }

        
        $test_questions = $em->getRepository('FrontFrontBundle:TeacherTestQuestions')->getTestQuestions(Auth::getAuthParam('id'), $test_id);
        $cnt = count($test_questions);
        for ($i = 0; $i < $cnt; $i++) {
            $test_questions[$i]['answers'] = $em->getRepository('FrontFrontBundle:TeacherQuestionOptions')->getQuestionOptionsByTeacherId(Auth::getAuthParam('id'), $test_questions[$i]['id']);
        }
//        \Front\FrontBundle\Additional\Debug::d1($test_questions);
        
        return $this->render('FrontFrontBundle:Account:Teacher/play_teacher_test.html.twig', array('test_details' => $test_details, 'test_questions' => $test_questions));
    }

}

