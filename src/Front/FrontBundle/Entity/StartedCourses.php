<?php

namespace Front\FrontBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * StartedCourses
 */
class StartedCourses
{
    /**
     * @var integer
     */
    private $id;

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
     * Set course
     *
     * @param \Front\FrontBundle\Entity\AvailableCourses $course
     * @return StartedCourses
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
