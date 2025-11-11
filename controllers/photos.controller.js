const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      const properFile = ['gif', 'jpg','png'];
      if(!properFile.includes(fileExt)) return res.status(400).json('Wrong file type');

      if(title.length > 25 || author.length > 50) return res.status(400).json('Too many letters');

      const properText = /^[a-zA-Z.]+$/;
      if(!properText.test(title)) return res.status(400).json('Title can only contain letters and dots');
      if(!properText.test(author)) return res.status(400).json('Author can only contain letters and dots');
      
      if(!email.includes('@') || !email.includes('.')) return res.status(400).json('wrong email');
      
      const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    
    let voter = await Voter.findOne({ user: req.clientIp });
    if (!voter) {
      voter = new Voter({ user: req.clientIp, votes: [req.params.id] });
      photoToUpdate.votes++;
      await photoToUpdate.save();
      await voter.save();
      res.send({ message: 'OK' });
    }
    if (voter.votes.includes(req.params.id)) {
      return res.status(500).json({message:'You have already voted for this photo'});
    }
    
    voter.votes.push(req.params.id);
    await voter.save();
    photoToUpdate.votes++;
    await photoToUpdate.save();
  
  } catch(err) {
    res.status(500).json(err);
  }

};
