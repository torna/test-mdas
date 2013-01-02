<?php

namespace Front\FrontBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * CourseSchedule
 */
class CourseSchedule
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var integer
     */
    private $day;

    /**
     * @var string
     */
    private $startHour;

    /**
     * @var string
     */
    private $endHour;

    /**
     * @var \Front\FrontBundle\Entity\AvailableCourses
     */
    private $course;


    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set day
     *
     * @param integer $day
     * @return CourseSchedule
     */
    public function setDay($day)
    {
        $this->day = $day;
    
        return $this;
    }

    /**
     * Get day
     *
     * @return integer 
     */
    public function getDay()
    {
        return $this->day;
    }

    /**
     * Set startHour
     *
     * @param string $startHour
     * @return CourseSchedule
     */
    public function setStartHour($startHour)
    {
        $this->startHour = $startHour;
    
        return $this;
    }

    /**
     * Get startHour
     *
     * @return string 
     */
    public function getStartHour()
    {
        return $this->startHour;
    }

    /**
     * Set endHour
     *
     * @param string $endHour
     * @return CourseSchedule
     */
    public function setEndHour($endHour)
    {
        $this->endHour = $endHour;
    
        return $this;
    }

    /**
     * Get endHour
     *
     * @return string 
     */
    public function getEndHour()
    {
        return $this->endHour;
    }

    /**
     * Set course
     *
     * @param \Front\FrontBundle\Entity\AvailableCourses $course
     * @return CourseSchedule
     */
    public function setCourse(\Front\FrontBundle\Entity\AvailableCourses $course = null)
    {
        $this->course = $course;
    
        return $this;
    }

    /**
     * Get course
     *
     * @return \Front\FrontBundle\Entity\AvailableCourses 
     */
    public function getCourse()
    {
        return $this->course;
    }
}
