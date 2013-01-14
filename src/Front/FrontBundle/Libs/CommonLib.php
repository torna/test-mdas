<?php

namespace Front\FrontBundle\Libs;

class CommonLib {

    protected static $project_path = '/var/www/learn/learn_files/';
    
    public static function formatDataForSchedule($schedule_data) {
        $formatted_data = array();

        foreach ($schedule_data as $course_id => $data) {
            $start = $data['data']['starts_on'];
            $end = $data['data']['finish_on'];

            $schedule_days = array();
            $cnt_schedule = count($data['schedule']);
            for ($i = 0; $i < $cnt_schedule; $i++) {
                $schedule_day = $data['schedule'][$i]['day'];
                $schedule_days[$schedule_day] = array('start_hour' => $data['schedule'][$i]['start_hour'], 'end_hour' => $data['schedule'][$i]['end_hour']);
            }
            
            while ($start != $end) {
                $current_day = date('N', strtotime($start));
                if (in_array($current_day, array_keys($schedule_days))) {
                    $timing = self::getTiming($schedule_days[$current_day]);
                    $formatted_data[] = array('title' => $data['data']['object_ro'],
                        'course_id' => $data['data']['id'],
                        'year' => date("Y", strtotime("-1 year", strtotime($start))),
                        'month' => date("m", strtotime("-1 month", strtotime($start))),
                        'day' => date("d", strtotime($start)),
                        'start_hour' => $timing['start_hour'],
                        'start_minute' => $timing['start_minute'],
                    );
                }
                $start = date("Y-m-d", strtotime("+1 day", strtotime($start)));
            }
        }
        
        return $formatted_data;
    }
    protected static function getTiming($schedule_item) {
        $start_time = $schedule_item['start_hour'];
        $end_time = $schedule_item['end_hour'];

        $explode = explode(':', $start_time);
        $start_hour = $explode[0];
        $start_minute = $explode[1];

        $explode = explode(':', $end_time);
        $end_hour = $explode[0];
        $end_minute = $explode[1];

        return array('start_hour' => $start_hour, 'start_minute' => $start_minute, 'end_hour' => $end_hour, 'end_minute' => $end_minute);
    }
    
    public static function createTeacherFolder($folder_name) {
        $status = mkdir(self::$project_path.$folder_name, 777);
        return $status;
    }
    
    public static function createFileForExecution($folder_name, $file_name, $file_content) {
        $fp = fopen(__DIR__.'/../../../../learn_files/'.$folder_name.'/'.$file_name, 'w');
        fwrite($fp, $file_content);
        fclose($fp);
        return file_exists(self::$project_path.$folder_name.'/'.$file_name);
    }
    
    /**
     * gets file list from common folder name
     */
    public static function getFolderFileList($folder_name) {
        $file_list = scandir(self::$project_path.$folder_name);
        unset($file_list[0], $file_list[1]);
        return $file_list;
    }
    
    public static function getFileContent($folder_name, $file_name) {
        $file_content = file_get_contents(self::$project_path.$folder_name.'/'.$file_name);
        return $file_content;
    }
    
    public static function deleteFile($folder_name, $file_name) {
        $status = unlink(self::$project_path.$folder_name.'/'.$file_name);
        return $status;
    }

}