const express = require('express');
const User = require('../models/user');
const UserGroup=require('../models/userGroups');
const checkAuth = require('../middleware/check-auth');
const checkAuth2 = require('../middleware/check-auth-without-immediate-response');
//const generatedHash = require('../middleware/hash-generator');
const router = express.Router();
router.post('',checkAuth, (req, res, next) => {
  console.log(req.body);
  UserGroup.find({title: req.body.title, owner:req.userData.userId})
    .then((result) => {
      // Checks if other owner has the same group name
      if (result.length > 0) {
        return res.status(409).json({
          message: 'Group already exists!'
        });
      }
      const newGroup = new UserGroup({
        title: req.body.title,
        description: req.body.description,
        users:req.body.users,
        owner:req.userData.userId
      });
      newGroup.save()
        .then (resultQuery => {
          res.status(201).json({
            message: 'Group was created successfully',
            query: resultQuery
          });
        })
        .catch(error => {
          res.status(500).json({
            message: 'Creating group failed',
            error: error
          })
        });
    });
});
router.get('', checkAuth, (req, res, next) => {
  UserGroup.find({$or: [
      {owner: req.userData.userId},
      {owner: {$in: UserGroup.users}}
    ]
  })
    .then(groups => {
      let message;
      if (groups.length === 0) {
        message = 'No groups were found'
      } else {
        message = 'All groups were found'
      }
      res.status(200).json({
        message: message,
        groups: groups
      });
    })
    .catch(error => {
      res.status(500).json({
        message: 'Fetching all groups failed',
        error: error
      })
    })
});

router.post('/addMember', (req, res, next) => {
  console.log(req.body);

  User.findOne({email: req.body.memberToAdd})
    .then((result) => {
      let message;
      if (result.length === 0) {
        message = 'User not found'
        console.log(message);
      } else {
        message = 'User has been found'
        console.log(req.body.memberToAdd);
        UserGroup.update({_id: req.body.groupId}, {$push: {users: req.body.memberToAdd}})
          .then(result => {
            res.status(201).json({
              message: 'User group updated',
            });
          })
          .catch(error => {
            res.status(500).json({
              message: 'Error while updating the group',
              error: error
            });
          })
      }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Error while retrieving the user',
        error: error
      });
    });
});
/*router.post('', (req, res, next) => {
  res.status(200).json({
    message: 'next step: create the first user group'
  });
});*/
router.get('/groupMembers', (req, res, next) => {
  UserGroup.find({
      owner: req.query.userId,
      title: req.query.title
    },
    {users: 1, _id: 0})
    .then(result => {
      let message;
      console.log(result);
      if (result.length === 0) {
        message = 'No members in the group yet.'
      } else {
        message = 'Group has members'

        /*User.find({email: {$in: emailResult.users}}, {_id: 0, email: 1})
          .then(result => {
            console.log(result);
            if (result.length === 0) {
              message = ' Members are not found, may be deleted from the system'
            } else {
              message = 'Members were found'
              res.status(200).json({
                message: message,
                result: result
              });
            }
          })
          .catch(error => {
            res.status(500).json({
              message: 'Fetching all group Members failed',
              error: error
            })
          })
        }*/
        res.status(200).json({
          message: message,
          result: result
        });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Retrieving all members failed',
        error: error
      })
    });
  });

module.exports = router;

