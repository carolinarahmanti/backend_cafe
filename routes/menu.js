//import library
const express = require("express"); 
const bodyParser = require("body-parser"); 
const auth = require("../auth"); 
const { Op } = require("sequelize"); 
const multer = require("multer"); // import library multer untuk upload file
const path = require("path"); // import library path untuk mengambil ekstensi file
const fs = require("fs"); // import library fs untuk menghapus file

//implementasi library
const app = express(); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

//import model
const model = require("../models/index"); // import model
const menu = model.menu;

//config storage image
const storage = multer.diskStorage({ // inisialisasi konfigurasi penyimpanan file
  destination: (req, file, cb) => { // konfigurasi folder penyimpanan file
    cb(null, "./public/image"); // folder penyimpanan file
  },
  filename: (req, file, cb) => { // konfigurasi nama file
    cb(null, "img-" + Date.now() + path.extname(file.originalname)); // nama file
  },
});
let upload = multer({ storage: storage }); // inisialisasi konfigurasi penyimpanan file

// mengambil semua data menu
app.get("/getAllData", auth, async (req, res) => {
  await menu
    .findAll() 
    .then((result) => {
      res.status(200).json({ 
        status: "success",
        data: result,
      });
    })
    .catch((error) => { 
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    });
});

// get data by id menu
app.get("/getById/:id", auth, async (req, res) => { 
  await menu
    .findByPk(req.params.id) 
    .then((result) => { 
      if (result) {
        res.status(200).json({ 
          status: "success",
          data: result,
        });
      } else {
        res.status(404).json({ 
          status: "error",
          message: "data tidak ditemukan",
        });
      }
    })
    .catch((error) => { 
      res.status(400).json({ 
        status: "error",
        message: error.message,
      });
    });
});

// create menu
app.post("/create", upload.single("gambar"), auth, async (req, res) => {
  const data = { 
    nama_menu: req.body.nama_menu,
    jenis: req.body.jenis,
    deskripsi: req.body.deskripsi,
    gambar: req.file.filename,
    harga: req.body.harga,
  };
  await menu
    .findOne({ where: { nama_menu: data.nama_menu } }) 
    .then((result) => { 
      if (result) { 
        res.status(400).json({ 
          status: "error",
          message: "nama menu sudah ada",
        });
      } else { 
        menu
          .create(data) 
          .then((result) => { 
            res.status(200).json({ 
              status: "success",
              message: "menu berhasil ditambahkan",
              data: result,
            });
          })
          .catch((error) => { 
            res.status(400).json({ 
              status: "error",
              message: error.message,
            });
          });
      }
    });
});

// delete menu
app.delete("/delete/:id_menu", auth, async (req, res) => { 
  const param = { id_menu: req.params.id_menu }; 

  menu
    .destroy({ where: param }) 
    .then((result) => { 
      if (result) { 
        res.status(200).json({ 
          status: "success",
          message: "menu berhasil dihapus",
          data: param,
        });
      } else { 
        res.status(404).json({ 
          status: "error",
          message: "data tidak ditemukan",
        });
      }
    })
    .catch((error) => { 
      res.status(400).json({ 
        status: "error",
        message: error.message,
      });
    });
});

// edit menu
app.patch("/edit/:id_menu", upload.single("gambar"), auth, async (req, res) => {
  const param = { id_menu: req.params.id_menu }; 
  const data = {
    nama_menu: req.body.nama_menu,
    jenis: req.body.jenis,
    deskripsi: req.body.deskripsi,
    harga: req.body.harga,
    resultArr: {},
  };

  menu.findOne({ where: param }).then((result) => {
    if (result) { 
      if (req.file) {
        let oldFileName = result.gambar; 
        let dir = path.join(__dirname, "../public/image/", oldFileName); 
        fs.unlink(dir, (err) => err);
        data.gambar = req.file.filename; 
      }
      menu
        .update(data, { where: param }) 
        .then((result) => { 
          res.status(200).json({ 
            status: "success",
            message: "data berhasil diubah",
            data: {
              id_menu: param.id_menu,
              nama_menu: data.nama_menu,
              harga: data.harga,
              deskripsi: data.deskripsi,
              gambar: data.gambar,
              jenis: data.jenis,
            },
          });
        })
        .catch((error) => { 
          res.status(400).json({ 
            status: "error",
            message: error.message,
          });
        });
    } else { 
      res.status(404).json({ 
        status: "error",
        message: "data tidak ditemukan",
      });
    }
  });
});

// mencari menu
app.get("/search/:nama_menu", auth, async (req, res) => { 
  menu 
    .findAll({ 
      where: { 
        [Op.or]: [ 
          { nama_menu: { [Op.like]: "%" + req.params.nama_menu + "%" } },
        ],
      },
    })
    .then((result) => { 
      if (result.length > 0) { 
        res.status(200).json({ 
          status: "success",
          message: "menu berhasil ditemukan",
          data: result,
        });
      } else { 
        res.status(400).json({ // mengembalikan response dengan status code 400 dan pesan error
          status: "error",
          message: "menu not found",
        });
      }
    })
    .catch((error) => { // jika gagal
      res.status(400).json({ // mengembalikan response dengan status code 400 dan pesan error
        status: "error",
        message: error.message,
      });
    });
});

module.exports = app; // export module app
