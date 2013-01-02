<?php

namespace Front\FrontBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * AvailableCourses
 */
class AvailableCourses
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var integer
     */
    private $maxNrStudents;

    /**
     * @var string
     */
    private $courseTopics;

    /**
     * @var string
     */
    private $courseDetails;

    /**
     * @var \DateTime
     */
    private $startsOn;

    /**
     * @var string
     */
    private $courseStatus;

    /**
     * @var \DateTime
     */
    private $added;

    /**
     * @var \Front\FrontBundle\Entity\Teachers
     */
    private $teacher;

    /**
     * @var \Front\FrontBundle\Entity\SystemObjects
     */
    private $object;


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
     * Set maxNrStudents
     *
     * @param integer $maxNrStudents
     * @return AvailableCourses
     */
    public function setMaxNrStudents($maxNrStudents)
    {
        $this->maxNrStudents = $maxNrStudents;
    
        return $this;
    }

    /**
     * Get maxNrStudents
     *
     * @return integer 
     */
    public function getMaxNrStudents()
    {
        return $this->maxNrStudents;
    }

    /**
     * Set courseTopics
     *
     * @param string $courseTopics
     * @return AvailableCourses
     */
    public function setCourseTopics($courseTopics)
    {
        $this->courseTopics = $courseTopics;
    
        return $this;
    }

    /**
     * Get courseTopics
     *
     * @return string 
     */
    public function getCourseTopics()
    {
        return $this->courseTopics;
    }

    /**
     * Set courseDetails
     *
     * @param string $courseDetails
     * @return AvailableCourses
     */
    public function setCourseDetails($courseDetails)
    {
        $this->courseDetails = $courseDetails;
    
        return $this;
    }

    /**
     * Get courseDetails
     *
     * @return string 
     */
    public function getCourseDetails()
    {
        return $this->courseDetails;
    }

    /**
     * Set startsOn
     *
     * @param \DateTime $startsOn
     * @return AvailableCourses
     */
    public function setStartsOn($startsOn)
    {
        $this->startsOn = $startsOn;
    
        return $this;
    }

    /**
     * Get startsOn
     *
     * @return \DateTime 
     */
    public function getStartsOn()
    {
        return $this->startsOn;
    }

    /**
     * Set courseStatus
     *
     * @param string $courseStatus
     * @return AvailableCourses
     */
    public function setCourseStatus($courseStatus)
    {
        $this->courseStatus = $courseStatus;
    
        return $this;
    }

    /**
     * Get courseStatus
     *
     * @return string 
     */
    public function getCourseStatus()
    {
        return $this->courseStatus;
    }

    /**
     * Set added
     *
     * @param \DateTime $added
     * @return AvailableCourses
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
     * Set teacher
     *
     * @param \Front\FrontBundle\Entity\Teachers $teacher
     * @return AvailableCourses
     */
    public function setTeacher(\Front\FrontBundle\Entity\Teachers $teacher = null)
    {
        $this->teacher = $teacher;
    
        return $this;
    }

    /**
     * Get teacher
     *
     * @return \Front\FrontBundle\Entity\Teachers 
     */
    public function getTeacher()
    {
        return $this->teacher;
    }

    /**
     * Set object
     *
     * @param \Front\FrontBundle\Entity\SystemObjects $object
     * @return AvailableCourses
     */
    public function setObject(\Front\FrontBundle\Entity\SystemObjects $object = null)
    {
        $this->object = $object;
    
        return $this;
    }

    /**
     * Get object
     *
     * @return \Front\FrontBundle\Entity\SystemObjects 
     */
    public function getObject()
    {
        return $this->object;
    }
}
