
const express = require("express");
const route = express.Router();
const Project = require("../models/project");



route.post("/project", async (req, res) => {
  try {
    console.log('helloworld')
    const user = req.user;

    const project = new Project({
      // title: req.body.title,
      // role:req.body.role,
      description: req.body.description,
      techStack: req.body.techStack,
      projectURL: req.body.projectURL,
      gitHubURL:req.body.gitHubURL,
      collaborators: req.body.collaborators, 
      projectImgURL:req.body.projectImgURL,
      createdBy: user._id
    });

    await project.save();
    res.json({ message: "Project added", project });

  } catch (err) {
    res.status(400).send(err.message);
  }
});


route.get("/project/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const projects = await Project.find({
      $or: [
        { createdBy: userId },
        { collaborators: userId }
      ]
    })
    .populate("collaborators", "name profileURL")
    .populate("createdBy", "name profileURL role");

    res.json({ data: projects });

  } catch (err) {
    res.status(400).send(err.message);
  }
});


route.post('/project/remove/:projectId', async (req, res) => {
  try {
    const user = req.user;
    const projectId = req.params.projectId;

    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    if (project.createdBy.toString() === user._id.toString()) {
      await Project.findByIdAndDelete(projectId);
      return res.json({ message: 'Project deleted (owner)' });
    }

    const isCollaborator = project.collaborators.some(
      id => id.toString() === user._id.toString()
    );

    if (!isCollaborator) throw new Error('Invalid request');

    project.collaborators = project.collaborators.filter(
      id => id.toString() !== user._id.toString()
    );

    await project.save();

    res.json({ message: 'Removed from collaborators' });

  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = route;