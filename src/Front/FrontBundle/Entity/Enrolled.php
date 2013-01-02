<?php

namespace Front\FrontBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Enrolled
 */
class Enrolled
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var string
     */
    private $payId;

    /**
     * @var integer
     */
    private $isPayed;

    /**
     * @var \DateTime
     */
    private $added;

    /**
     * @var \Front\FrontBundle\Entity\AvailableCourses
     */
    private $course;

    /**
     * @var \Front\FrontBundle\Entity\Students
     */
    private $student;


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
     * Set payId
     *
     * @param string $payId
     * @return Enrolled
     */
    public function setPayId($payId)
    {
        $this->payId = $payId;
    
        return $this;
    }

    /**
     * Get payId
     *
     * @return string 
     */
    public function getPayId()
    {
        return $this->payId;
    }

    /**
     * Set isPayed
     *
     * @param integer $isPayed
     * @return Enrolled
     */
    public function setIsPayed($isPayed)
    {
        $this->isPayed = $isPayed;
    
        return $this;
    }

    /**
     * Get isPayed
     *
     * @return integer 
     */
    public function getIsPayed()
    {
        return $this->isPayed;
    }

    /**
     * Set added
     *
     * @param \DateTime $added
     * @return Enrolled
     */
    public function setAdded($added)
    {
        $this->added = $added;
    
        return $this;
    }

    /**
     * Get added
     *
     * @return \DateTime 
     */
    public function getAdded()
    {
        return $this->added;
    }

    /**
     * Set course
     *
     * @param \Front\FrontBundle\Entity\AvailableCourses $course
     * @return Enrolled
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

    /**
     * Set student
     *
     * @param \Front\FrontBundle\Entity\Students $student
     * @return Enrolled
     */
    public function setStudent(\Front\FrontBundle\Entity\Students $student = null)
    {
        $this->student = $student;
    
        return $this;
    }

    /**
     * Get student
     *
     * @return \Front\FrontBundle\Entity\Students 
     */
    public function getStudent()
    {
        return $this->student;
    }
}
