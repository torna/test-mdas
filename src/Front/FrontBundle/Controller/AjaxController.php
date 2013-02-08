<?php

namespace Front\FrontBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Front\FrontBundle\Security\Auth;

class AjaxController extends Controller {

    public function indexAction() {
        $request = $this->getRequest();
        $em = $this->getDoctrine()->getEntityManager();
        $todo = $request->get('todo');
        switch ($todo) {
            case 'get_board':
                if (Auth::isAuth()) {
                    $board = $request->get('board');
                    if ($board == 'programming') {
                        return $this->render('FrontFrontBundle:Ajax:board_wb3.html.twig', array('board' => $board, 'teacher_folder' => Auth::getAuthParam('course_working_folder')));
                    } elseif ($board == 'languages') {
                        $teachers_tests = $text_list = array();
                        if (Auth::getAuthParam('account_type') == 'teacher') {
                            $text_list = $em->getRepository('FrontFrontBundle:TeacherTexts')->getTeacherTexts(Auth::getAuthParam('id'));
                            $teachers_tests = $em->getRepository('FrontFrontBundle:TeacherTests')->getTeacherTests(Auth::getAuthParam('id'));
                        }
                        return $this->render('FrontFrontBundle:Ajax:board_wb2.html.twig', array('text_list' => $text_list, 'account_type' => Auth::getAuthParam('account_type'), 'teachers_tests' => $teachers_tests));
                    } elseif ($board == 'draw') {
                        return $this->render('FrontFrontBundle:Ajax:board_wb1.html.twig');
                    } elseif ($board == 'presentation') {
                        $presentation_list = array();
                        if (Auth::getAuthParam('account_type') == 'teacher') {
                            $presentation_list = $em->getRepository('FrontFrontBundle:Teachers')->getTeacherPresentationList(Auth::getAuthParam('id'));
                        }
                        return $this->render('FrontFrontBundle:Ajax:board_wb4.html.twig', array('presentation_list' => $presentation_list));
                    }
                }
                break;
            case 'get_wb1_generic':
                if (Auth::isAuth()) {
                    $file_content = '';
                    $file_name = $request->get('file_name');
                    if ($file_name != 'undefined' && $file_name) {
                        $file_content = \Front\FrontBundle\Libs\CommonLib::getFileContent(Auth::getAuthParam('course_working_folder'), $file_name);
                        $file_content = preg_replace('/id="svg_.*"/iU', 'id="svg_%zone_id%"', $file_content);
                        $file_content = preg_replace('/data\-draw\-id=".*"/iU', 'data-draw-id="%zone_id%"', $file_content);
                    }
                    return $this->render('FrontFrontBundle:Ajax:_wb1_generic_content.html.twig', array('file_content' => $file_content));
                }
                break;
            case 'get_wb2_generic':
                if (Auth::isAuth()) {
                    $text_hash = $request->get('unique_id');
                    $text_data = $em->getRepository('FrontFrontBundle:TeacherTexts')->getTeacherTextByHash($text_hash);
                    $text = $text_data['text_content'];
                    return $this->render('FrontFrontBundle:Ajax:_wb2_generic_content.html.twig', array('text' => $text));
                }
                break;
            case 'get_wb3_generic':
                if (Auth::isAuth()) {
                    $file_content = '';
                    $file_name = $request->get('file_name');
                    if ($file_name != 'undefined' && $file_name) {
                        $file_content = \Front\FrontBundle\Libs\CommonLib::getFileContent(Auth::getAuthParam('course_working_folder'), $file_name);
                    }
                    return $this->render('FrontFrontBundle:Ajax:_wb3_generic_content.html.twig', array('file_content' => $file_content, 'account_type' => Auth::getAuthParam('account_type')));
                }
                break;
            case 'get_wb4_generic':
                if (Auth::isAuth()) {
                    $presentation_hash = $request->get('presentation_hash');
                    $presentations_sheets = $em->getRepository('FrontFrontBundle:Teachers')->getTeacherPresentationSheetsBySheetHash($presentation_hash);
                    return $this->render('FrontFrontBundle:Ajax:_wb4_generic_content.html.twig', array('presentation_sheets' => $presentations_sheets, 'account_type' => Auth::getAuthParam('account_type')));
                }
                break;
            case 'save_file_for_execution':
                if (Auth::isAuth()) {
                    $status_arr = array();
                    $file_name = $request->get('file_name');
                    $working_folder = $request->get('namespace');
                    $file_content = $request->get('file_content');
                    $status = \Front\FrontBundle\Libs\CommonLib::createFileForExecution($working_folder, $file_name, $file_content);
                    if ($status) { // file was created successfully
                        $status_arr['status'] = 'ok';
                        $status_arr['file_path'] = $working_folder . '/' . $file_name;
                    } else {
                        $status_arr['status'] = 'fail';
                        /**
                         * @TODO 
                         * log this error
                         */
                    }
                    die(json_encode($status_arr));
                }
                break;
            case 'save_svg_file':
                if (Auth::isAuth()) {
                    $status_arr = array();
                    $file_name = $request->get('file_name');
                    $working_folder = $request->get('namespace');
                    $file_content = $request->get('file_content');
                    $status = \Front\FrontBundle\Libs\CommonLib::createFileForExecution($working_folder, $file_name, $file_content);
                    if ($status) { // file was created successfully
                        $status_arr['status'] = 'ok';
                        $status_arr['file_path'] = $working_folder . '/' . $file_name;
                    } else {
                        $status_arr['status'] = 'fail';
                        /**
                         * @TODO 
                         * log this error
                         */
                    }
                    die(json_encode($status_arr));
                }
                break;
            case 'get_tree_view_content':
                // getting file list from common folder
                $file_list = \Front\FrontBundle\Libs\CommonLib::getFolderFileList(Auth::getAuthParam('course_working_folder'));
                die(json_encode(array_values($file_list)));
                break;
            case 'delete_file':
                // removing file
                $file_name = $request->get('file_name');
                $status = \Front\FrontBundle\Libs\CommonLib::deleteFile(Auth::getAuthParam('course_working_folder'), $file_name);
                /**
                 * @todo
                 * log status error
                 */
                die;
                break;
            case 'teacher_test':
                $test_hash = $request->get('test_hash');

                if (!$test_hash) {
                    /**
                     * @TODO 
                     * log this error
                     */
                    die('Error agh2h4.');
                }

                // check if teacher owns the test
                $test_details = $em->getRepository('FrontFrontBundle:TeacherTests')->getTestDetailsByHash($test_hash);
                if (empty($test_details)) { // the test does not exist
                    /**
                     * @TODO 
                     * log this error
                     */
                    die('Test does not exist.');
                }

                $test_questions = array();
                $placeholder = '';
                if ($test_details['test_type'] == 'quiz') {
                    $test_questions = $em->getRepository('FrontFrontBundle:TeacherTestQuestions')->getTestQuestionsByTestHash($test_hash);
                    $cnt = count($test_questions);
                    for ($i = 0; $i < $cnt; $i++) {
                        $test_questions[$i]['answers'] = $em->getRepository('FrontFrontBundle:TeacherQuestionOptions')->getQuestionOptionsByQuestionId($test_questions[$i]['id']);
                    }
                } elseif ($test_details['test_type'] == 'placeholder') {
                    $test_placeholder = $em->getRepository('FrontFrontBundle:TeacherTestQuestions')->getPlaceholderDataByTestHash($test_hash);
                    $placeholder = str_replace('{placeholder}', '<input type="text" class="test_placeholder" />', $test_placeholder['placeholder_text']);
                }
                return $this->render('FrontFrontBundle:Account:Teacher/_test_form.html.twig', array(
                            'test_details' => $test_details,
                            'test_questions' => $test_questions,
                            'test_placeholder' => $placeholder,
                            'account_type' => Auth::getAuthParam('account_type'),
                            'is_classroom' => true
                        ));
                die;
                break;
            case 'store_svg_presentation':
                $err = array();
                if ((Auth::isAuth() && Auth::getAuthParam('account_type') == 'teacher')) {
                    $presentation_id = $request->get('presentation_id');
                    $sheet_id = $request->get('sheet_id');
                    if (!is_numeric($presentation_id)) {
                        $err['err'] = 1;
                        $err['msg'] = 'Presentation id is not numeric';
                        die(json_encode($err));
                    }
                    $presentation_details = $em->getRepository('FrontFrontBundle:Teachers')->getTeacherPresentationDetails(Auth::getAuthParam('id'), $presentation_id);
                    if (empty($presentation_details)) { // teacher does not own the presentation
                        $err['err'] = 1;
                        $err['msg'] = 'No access';
                        die(json_encode($err));
                    }
                    $file_content = $request->get('svg_data');
                    $file_content = str_replace('<svg width="1000" height="700" id="svgcontent" overflow="visible" x="2000" y="1400" viewBox="0 0 1000 700">', '<svg width="1000" height="700" xmlns="http://www.w3.org/2000/svg">', $file_content);
                    if (is_numeric($sheet_id)) {
                        $sheet_data = $em->getRepository('FrontFrontBundle:Teachers')->getPresentationSheetDetails(Auth::getAuthParam('id'), $sheet_id);
                        if (empty($sheet_data)) { // teacher does not own the presentation sheet
                            $err['err'] = 1;
                            $err['msg'] = 'No access to sheet';
                            die(json_encode($err));
                        }
                        $em->getRepository('FrontFrontBundle:Teachers')->updatePresentationSheet($sheet_id, $file_content);
                    } else {
                        $em->getRepository('FrontFrontBundle:Teachers')->createPresentationSheet($presentation_id, $file_content);
                    }
                } else {
                    $err['err'] = 1;
                    $err['msg'] = 'Not auth';
                    die(json_encode($err));
                }
                $err['err'] = 0;
                $err['msg'] = 'Ok';
                die(json_encode($err));

                break;
        }
    }

}
