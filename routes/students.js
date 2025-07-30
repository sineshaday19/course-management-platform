const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Student, Class, Cohort } = require('../models');
const { authorizeManager } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students with filtering
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: cohortId
 *         schema:
 *           type: string
 *         description: Filter by cohort ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 */
router.get('/', [
  query('classId').optional().isUUID(),
  query('cohortId').optional().isUUID(),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { classId, cohortId, isActive, page = 1, limit = 10 } = req.query;

    // Build where clause
    const whereClause = {};
    if (classId) whereClause.classId = classId;
    if (cohortId) whereClause.cohortId = cohortId;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const offset = (page - 1) * limit;

    const students = await Student.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        },
        {
          model: Cohort,
          as: 'cohort',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        students: students.rows,
        pagination: {
          total: students.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(students.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get a specific student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student retrieved successfully
 *       404:
 *         description: Student not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'startDate', 'graduationDate']
        },
        {
          model: Cohort,
          as: 'cohort',
          attributes: ['id', 'name', 'intakePeriod']
        }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: { student }
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student (Managers only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - studentNumber
 *               - classId
 *               - cohortId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *                 minLength: 2
 *               studentNumber:
 *                 type: string
 *                 minLength: 5
 *               classId:
 *                 type: string
 *                 format: uuid
 *               cohortId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', [
  authorizeManager,
  body('email').isEmail().normalizeEmail(),
  body('name').isLength({ min: 2, max: 100 }).trim(),
  body('studentNumber').isLength({ min: 5, max: 50 }).trim(),
  body('classId').isUUID(),
  body('cohortId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { email, name, studentNumber, classId, cohortId } = req.body;

    // Check if student with same email already exists
    const existingStudentByEmail = await Student.findOne({
      where: { email, isActive: true }
    });

    if (existingStudentByEmail) {
      return res.status(409).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Check if student with same student number already exists
    const existingStudentByNumber = await Student.findOne({
      where: { studentNumber, isActive: true }
    });

    if (existingStudentByNumber) {
      return res.status(409).json({
        success: false,
        message: 'Student with this student number already exists'
      });
    }

    const student = await Student.create({
      email,
      name,
      studentNumber,
      classId,
      cohortId
    });

    // Fetch the created student with related data
    const createdStudent = await Student.findByPk(student.id, {
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        },
        {
          model: Cohort,
          as: 'cohort',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { student: createdStudent }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Update a student (Managers only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *                 minLength: 2
 *               studentNumber:
 *                 type: string
 *                 minLength: 5
 *               classId:
 *                 type: string
 *                 format: uuid
 *               cohortId:
 *                 type: string
 *                 format: uuid
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 *       403:
 *         description: Access denied
 */
router.put('/:id', [
  authorizeManager,
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().isLength({ min: 2, max: 100 }).trim(),
  body('studentNumber').optional().isLength({ min: 5, max: 50 }).trim(),
  body('classId').optional().isUUID(),
  body('cohortId').optional().isUUID(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const student = await Student.findOne({
      where: { id, isActive: true }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if email is being updated and if it already exists
    if (updateData.email && updateData.email !== student.email) {
      const existingStudent = await Student.findOne({
        where: { email: updateData.email, isActive: true }
      });

      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: 'Student with this email already exists'
        });
      }
    }

    // Check if student number is being updated and if it already exists
    if (updateData.studentNumber && updateData.studentNumber !== student.studentNumber) {
      const existingStudent = await Student.findOne({
        where: { studentNumber: updateData.studentNumber, isActive: true }
      });

      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: 'Student with this student number already exists'
        });
      }
    }

    await student.update(updateData);

    // Fetch updated student with related data
    const updatedStudent = await Student.findByPk(id, {
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        },
        {
          model: Cohort,
          as: 'cohort',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: { student: updatedStudent }
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete a student (Managers only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', [authorizeManager], async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findOne({
      where: { id, isActive: true }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Soft delete
    await student.update({ isActive: false });

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 