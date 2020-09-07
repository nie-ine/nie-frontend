const express = require('express');
const User = require('../models/user');
const UserGroup=require('../models/userGroups');
const checkAuth = require('../middleware/check-auth');
const checkAuth2 = require('../middleware/check-auth-without-immediate-response');
//const generatedHash = require('../middleware/hash-generator');
const Page = require('../models/page');
const PageSet = require('../models/page-set');
const router = express.Router();

router.post('',checkAuth, (req, res, next) => { // done with the new logic
  console.log(req.body);
  UserGroup.find({title: req.body.title, adminsUsers: {$in:req.userData.userId} })
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
        users:[req.userData.userId],
        adminsUsers:[req.userData.userId],
        hasPages:[],
        hasActions: []
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

router.get('', checkAuth, (req, res, next) => { // done with the new logic
  UserGroup.find({$or: [
      {adminsUsers: {$in:req.userData.userId}},
      {users: {$in: req.userData.userId}}
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

router.get('/:title/listGroupMembers',checkAuth, (req, res, next) => {
  UserGroup.find({
      owner: req.userData.userId,
      title: req.params.title
    },
    {users: 1, _id: 0})
    .then(result => {
      let message;
      console.log(result);
      if (result.length === 0) {
        message = 'No members in the group yet.'
      } else {
        message = 'Group has members'

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
        UserGroup.update({_id: req.body.groupId}, {$addToSet: {users: req.body.memberToAdd}})
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

router.post('/removeMember',checkAuth, (req, res, next) => {
  UserGroup.find({
      _id: req.body.groupId,
      users: {$in: req.body.memberToRemove}
    },
    {_id: 1})
    .then(result => {
      let message;
      if (result.length === 0) {
        message = 'User is not one of the group members.';
      } else {
        message = 'User has been found.';
        UserGroup.update({_id: req.body.groupId}, {$pull: {users: req.body.memberToRemove}})
          .then(updateResult => {
            res.status(201).json({
              message : 'User has been successfully removed from the group.'
            });
          })
          .catch(error => {
            res.status(500).json({
              message: 'Retrieving member failed',
              error: error
            })
          });
      }
    }).catch(error => {
    res.status(500).json({
      message: 'Error while retrieving the user',
      error: error
    });
  });
});

router.post('/:groupToDelete',checkAuth, (req, res, next) => {
  UserGroup.deleteOne({
      owner: req.userData.userId,
      title: req.params.groupToDelete
    })
    .then((deletedGroup) => {
      if (deletedGroup.n === 0) {
        return res.status(400).json({
          message: 'Group cannot be deleted'
        });
      } else {
        res.status(200).json({
          message: 'Group has been deleted successfully.'
        });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Deleting group failed',
        error: error
      })
    });
});

router.post('/removeCurrentUserFromGroup/:groupId',checkAuth, (req, res, next) => {
  console.log(req.userData.userId);
  UserGroup.updateOne({$and:[
    {owner: {$ne: req.userData.userId}},
    {_id: req.params.groupId}
    ]},
    {$pull: {users: req.userData.email}})
    .then((updatedDocument) => {
      if (updatedDocument.n === 0) {
        res.status(400).json({
          message: 'User cannot be removed from the group.'
        });
      } else {
        return res.status(200).json({
          message: 'User has been removed successfully from the group.',
          updatedGroup: updatedDocument
        });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Updating group failed.',
        error: error
      })
    });
});

router.post('/assignNewOwner/:groupId&:email',checkAuth, (req, res, next) => {
  console.log(req.userData.userId);
  console.log(req.params.groupId||" "|| req.params.email);
  User.find({email: req.params.email})
    .then((result) => {
      let message;
      if (result.length === 0) {
        message = 'User not found'

      } else {
        message = 'User has been found'
        console.log(message);
        UserGroup.updateOne(
          {_id: req.params.groupId},
          {$set: {owner: result[0]._id}, $addToSet: {users: req.params.email}})
          .then(updateResult => {
            res.status(201).json({

              message: 'User group updated' //+ result[0]._id,
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
router.post('/updateUserGroup/:title&:description',checkAuth, (req, res, next) => {
  UserGroup.update(
          {owner: req.userData.userId,_id: req.body.groupId},
          {$set: {title: req.params.title, description: req.params.description}})
          .then(updateResult => {
            res.status(201).json({
              message: 'User group updated', //+ result[0]._id,
              result: updateResult
            });
          })
          .catch(error => {
            res.status(500).json({
              message: 'Error while updating the group',
              error: error
            });
          })
      });
router.get('/showUserGroupDetails/:groupId',checkAuth, (req, res, next) => {   ///done editing with the new logic
  console.log(req.params.groupId);
console.log(req.userData.userId);
  UserGroup.findOne({_id: req.params.groupId})///({$and: [{_id: req.params.groupId}, {adminUsers:{$in: [req.userData.userId]}}]})
    .populate('hasActions')
    .populate({
      path: 'hasPageSet',
      populate: {
        path: 'hasPages'
      }
    })
    .then(result => {
      if(result.length===0) {
        message: 'Group not found, or you are not the owner of the group.'
      }
      else {
          message = 'Group is found'
          res.status(200).json({
            message: message,
            result: result
          });
        }
    })
    .catch(error => {
      res.status(500).json({
        message: 'You are not the owner of the group',
        error: error
      });
    })
});
//should we add the logic, if we found some shared pages that belongs to the pageSet to remove them as well as sharing the whole pageSet.
router.post('/sharePageSet/:pageSetId&:groupId'/*,checkAuth*/, (req, res, next) => {
  PageSet.find({_id:req.params.pageSetId})
    .then((result) => {
      let message;
      if (result.length === 0) {
        message = 'PageSet not found'
      } else {
        message = 'PageSet has been found'
        console.log(message);
        UserGroup.updateOne(
          {_id: req.params.groupId},
          {$addToSet: {hasPageSets: req.params.pageSetId}})//, $pull: {hasPages: result[0].hasPages}})
          .then(updateResult => {
            res.status(201).json({
              message: 'User group updated',
              result: updateResult//+ result[0]._id,
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
          message: 'Error while retrieving the PageSet',
          error: error
        });
      });
  });
router.post('/sharePage/:pageId&:groupId'/*,checkAuth*/, (req, res, next) => {
  Page.find({_id:req.params.pageId})
    .then((result) => {
      let message;
      if (result.length === 0) {
        message = 'Page not found'
      } else {
        message = 'Page has been found'
        console.log(message);
        UserGroup.updateOne(
          {_id: req.params.groupId},
          {$addToSet: {hasPages: req.params.pageId}})
          .then(updateResult => {
            res.status(201).json({
              message: 'User group updated' ,//+ result[0]._id,
              result: updateResult
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
        message: 'Error while retrieving the Page',
        error: error
      });
    });
});
router.get('/showPageSets/:groupId'/*,checkAuth*/, (req, res, next) => {
  UserGroup.find(
    {_id: req.params.groupId}, {_id:0, hasPageSets:1})
    .then(updateResult => {
      res.status(201).json({
        message: 'PageSets retrieved',
        PageSets: updateResult[0]//+ result[0]._id,
      });
    })
    .catch(error => {
      res.status(500).json({
        message: 'Error while retrieving the pageSets',
        error: error
      });
    })
});
router.get('/showPages/:groupId'/*,checkAuth*/, (req, res, next) => {
  UserGroup.find(
    {_id: req.params.groupId}, {_id:0, hasPages:1})
    .then(updateResult => {
      res.status(201).json({
        message: 'Pages retrieved',
        Pages: updateResult[0]//+ result[0]._id,
      });
    })
    .catch(error => {
      res.status(500).json({
        message: 'Error while retrieving the pages',
        error: error
      });
    })
});
module.exports = router;

