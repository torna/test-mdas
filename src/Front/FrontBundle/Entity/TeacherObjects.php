<?php

namespace Front\FrontBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * TeacherObjects
 */
class TeacherObjects
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var integer
     */
    private $experienceYears;

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
    private $obiect;


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
     * Set experienceYears
     *
     * @param integer $experienceYears
     * @return TeacherObjects
     */
    public function setExperienceYears($experienceYears)
    {
        $this->experienceYears = $experienceYears;
    
        return $this;
    }

    /**
     * Get experienceYears
     *
     * @return integer 
     */
    public function getExperienceYears()
    {
        return $this->experienceYears;
    }

    /**
     * Set added
     *
     * @param \DateTime $added
     * @return TeacherObjects
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
     * @return TeacherObjects
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
     * Set obiect
     *
     * @param \Front\FrontBundle\Entity\SystemObjects $obiect
     * @return TeacherObjects
     */
    public function setObiect(\Front\FrontBundle\Entity\SystemObjects $obiect = null)
    {
        $this->obiect = $obiect;
    
        return $this;
    }

    /**
     * Get obiect
     *
     * @return \Front\FrontBundle\Entity\SystemObjects 
     */
    public function getObiect()
    {
        return $this->obiect;
    }
}
