/*
IF EACCES
https://github.com/docker/for-win/issues/3171#issuecomment-554587817

로그인 여부의 쿠키가 있으면
	DB에서 일치하는 ID를 찾아서 
		사서여부를 비교해서
			맞으면 사서 리스트로 리다이렉트
			틀리면 이용자 리스트로 리다이렉트
등록이나 로그인 둘중하나를 입력받는다
아이디와 비밀번호를 입력받아 저장한다
로그인이면 DB에 저장된 아이디를 비교해서 
	일치하면 비밀번호도 일치하는지 비교한다
		비밀번호가 일치하지않으면 에러메시지 출력
	ID가 일치하지않으면 에러메시지 출력

	맞으면 
		ID를 로그인 쿠키로 저장해서 보내준다
		사서 여부를 비교해서 사서면 사서용 도서리스트 출력
		아니면 이용자용 도서리스트 출력

등록이면 저장된 아이디를 비교해서 일치하는지 본다
일치하면 에러메시지 출력
없으면 아이디, 비밀번호 사서여부를 DB에 저장한다
로그인/등록 으로 리다이렉트

사서 이용자용 리스트
DB에 기록된 모든 책을 알파벳 순서대로 출력한다

책등록을 입력받으면
DB의 제일 마지막에 기록된 책의 ISBN + 1이나 리스트가 비어있으면 0으로 ISBN을 저장한다
책의 제목, 작가, 페이지수, 에디션을 입력받고 추가로 대출 가능으로 저장한다
DB의 맨마지막에 기록을 해주고 리스트로 다시 리다이렉트

책삭제를 입력받으면
제목, 작가, 페이지수, ISBN중 하나를 선택해서 DB의 모든 책을 그 값이랑 비교해준다
일치를 하는 책들은 모두 출력한다 
원하는 책을 입력받은다음 해당되는 책을 DB에서 지워주고 리스트로 리다이렉트

https://www.section.io/engineering-education/what-are-cookies-nodejs/
*/

var express = require('express');
const cookieParser = require('cookie-parser');
let mongoose = require('mongoose');
var app = express();
var PORT = 1649;
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(express.static("views"));

app.get('/', async function(req, res) {
  await mongoose.connect('mongodb://127.0.0.1:27017/lib');
  // 로그인 여부의 쿠키가 있으면
  let check_login = req.cookies.ID;
  if (check_login != null) {
    console.log(check_login);
    // DB에서 일치하는 ID를 찾아서 
    let ret = await r_user.findOne({ id: check_login });
    // 사서여부를 비교해서
    if (ret.is_lib == "true") {
      // 맞으면 사서 리스트로 리다이렉트
      res.send(`<meta http-equiv="Refresh" content="0; url='/libr_list'"/>`);
    } else {
      // 틀리면 이용자 리스트로 리다이렉트
      console.log("USER LIB");
    }
  } else {
  // 등록이나 로그인 둘중하나를 입력받는다
   res.render('login');
  }
});

const reg_user = new mongoose.Schema({
  id: {type: String},
  pw: {type: String},
  is_lib: {type: String},
  book_list: [{isbn: Number, title: String}]
});

  // 책의 제목, 작가, 페이지수, 에디션을 입력받고 추가로 대출 가능으로 저장한다

const reg_book = new mongoose.Schema({
  isbn: {type: Number},
  title: {type : String},
  author: {type: String},
  edition: {type: String},
  page_num: {type: Number},
  is_avail: {type:String},
  bor_user: {type:String}
});

const r_user = mongoose.model('reg_users', reg_user);
const r_book = mongoose.model('reg_books', reg_book);

// 로그인이면
app.post('/login', async function(req, res) {
  await mongoose.connect('mongodb://127.0.0.1:27017/lib');
  //아이디와 비밀번호를 입력받아 저장한다
  let input_id = req.body["id"]; 
  let input_pw = req.body["pw"];
  // 로그인이면 DB에 저장된 아이디를 비교해서 

  let ret = await r_user.findOne({ id: input_id });
  // ID가 일치하지않으면 에러메시지 출력
  if (!ret) {
    console.log("NO ID FOUND");
    res.send(`<meta http-equiv="Refresh" content="0; url='/'"/>`);
    } else {
      // 	일치하면 비밀번호도 일치하는지 비교한다
      if (ret.pw == input_pw) {
        // 맞으면 ID를 로그인 쿠키로 저장해서 보내준다
        res.cookie(`ID`,input_id);
        // 사서 여부를 비교해서 사서면 사서용 도서리스트로 리다이렉트
        if (res.is_lib != "true") {
          res.send(`<meta http-equiv="Refresh" content="0; url='/libr_list'"/>`);
        } else {
          // 아니면 이용자용 도서리스트 리다이렉트
          console.log("USER LIBRARY");
        }
      } else {
          // 	비밀번호가 일치하지않으면 에러메시지 출력
        console.log("PASSWORD INCORRECT");
      }
    }
});

// 등록이면
app.post('/register', async function(req, res) {  
  await mongoose.connect('mongodb://127.0.0.1:27017/lib');
  let input_id = req.body["id"]; 
  let input_pw = req.body["pw"];

  let ret = r_user.findOne({name: input_id });

  // 저장된 아이디를 비교해서 일치하는지 본다
  if (ret) {
    console.log("ID ALREADY EXISTS");
  } else {
    // 없으면 아이디, 비번, 사서인지 이용자인지의 여부를 DB에 저장한다
    let box = req.body["admin"];
    let box_check = "";
    if (box == "on") {
      box_check = "true";
    } else {
      box_check = "false";
    }
  
    const new_entry = new r_user({ 
      id: input_id,
       pw: input_pw,
       is_lib: box_check,
       book_list: {isbn: 0, title: "TEST"}
    });

    await new_entry.save();

    // 로그인/등록으로 리다이렉트
    res.render('/login');
  }
});

function alpha_order(a, b) {
  if (a.title.toUpperCase() == a.title.toLowerCase()) {
    return 1;
  } else if (b.title.toUpperCase() == b.title.toLowerCase()) {
    return -1;
  }

  if (a.title.toUpperCase() < b.title.toUpperCase()) {
    return -1;
  }
  if (a.title.toUpperCase() > b.title.toUpperCase()) {
    return 1;
  }
  return 0;
}

// 사서 이용자용 리스트
app.get('/libr_list', async function(req, res) {
  await mongoose.connect('mongodb://127.0.0.1:27017/lib');
  // DB에 기록된 모든 책을 알파벳 순서대로 출력한다
  const books = await r_book.find({});
  books.sort(alpha_order);  

  res.render('test_libr', {books});
  //res.render('check');
});

// 로그아웃
app.get('/logout', async function(req, res) {
  // 로그아웃을 받으면 쿠키삭제를 보낸다
  res.clearCookie('ID');
  console.log("ASDASDASD");
  // 로그인으로 리다이렉트
  res.render('login');
});

// 이용자용 리스트
app.get('/user_list', async function(req, res) {
  // 등록된 책들을 알파벳순으로 나열해준다
  await mongoose.connect('mongodb://127.0.0.1:27017/lib');
  // 등록된 책들을 알파벳순으로 나열해준다
  // 책의 제목, 작가, 페이지수, ISBN, 에디션 대출 여부를 출력해준다
  const books = await r_book.find({});
  books.sort(alpha_order); 

  res.render('user_libr', {books});
});

// 대여를 입력받으면
app.post('/borrow_title', async (req, res) => {
// 대여를 원하는 책들의 숫자를 받아서 저장한다
let bor_count = 0;
for (let c_isbn = 0; c_isbn < ret.length; c_isbn++) {
  isbn_str = ret[c_isbn].isbn.toString();
  if (req.body[isbn_str] == "on") {
    bor_count++;
  }
}

// 사용자의 대여리스트의 크기를 5랑 비교해서
// 크기가 5거나 크기 + 책의 수가 5 이상이면 
// 	에러 메세지 출력
// 아니면 
// 	선택한 모든 책들의 대여여부를 비교해서
// 	이미 대여가 되어있는 책이 있으면 에러메세지를 출력
// 	아니면 대여리스트에 책들을 추가해주고 대여여부를 거짓으로 바꿔준다	

});

// 반납을 입력받으면
app.post('/borrow_title', async (req, res) => {
  await mongoose.connect('mongodb://127.0.0.1:27017/lib');
  // 사용자의 대여리스트를 알파벳순으로 출력해준다
  const books = await r_book.find({});
  books.sort(alpha_order);  

  res.render('borrow_libr', {books});
// 반납을 하고싶은 책을 입력받는다
// 입력받은 책들을 대여리스트에서 삭제하고 
// 각 책들의 대여여부를 참으로 바꿔준다
});

// 책등록을 입력받으면
app.post('/reg_title', async (req, res) => {
  // DB의 제일 마지막에 기록된 책의 ISBN + 1이나 리스트가 비어있으면 0으로 ISBN을 저장한다
  await mongoose.connect('mongodb://127.0.0.1:27017/lib');
  let ret = await r_book.find({}).sort({_id: -1}).limit(1);
  let cur_isbn = 0;

  if (ret.length) {
    cur_isbn = ret[0].isbn;
    cur_isbn = cur_isbn + 1;
  }

  // 책의 제목, 작가, 페이지수, 에디션을 입력받고 추가로 대출 가능으로 저장한다
  let i_title = req.body["b_title"]; 
  let i_author = req.body["b_author"];
  let i_edition = req.body["b_edition"]; 
  let i_pnum = req.body["b_pnum"];

  //기입된 제목, 작가, 에디션이 완전히 겹치는 책이 있는지 확인을 해야한다
  ret = await r_book.find({title: i_title, author: i_author, edition: i_edition, page_num: i_pnum});
  if (ret.length) {
    // 겹치면 에러를 출력하고
    console.log("ERROR, DOUPLICATE REGISTER");
  } else {
    const new_book = new r_book({ 
      isbn: cur_isbn,
      title: i_title,
      author: i_author,
      edition: i_edition,
      page_num: i_pnum,
      is_avail: "true",
    });

    // 아니면 DB의 맨마지막에 기록을 해주고 
    await new_book.save();
  }

  // 리스트로 다시 리다이렉트
  res.send(`<meta http-equiv="Refresh" content="0; url='/libr_list'"/>`);
});

// 책삭제를 입력받으면
app.post('/del_title', async (req, res) => {

  //isbn을 체크해서 책이 체크되있는지를 본다음에 체크된 책들만 삭제해놓는 방식

  // 원하는 책을 입력받은다음 해당되는 책을 DB에서 지워준다 

  await mongoose.connect('mongodb://127.0.0.1:27017/lib');

  let ret = await r_book.find({}, 'isbn');
  let del_list = [];
  let isbn_str = "";

  for (let c_isbn = 0; c_isbn < ret.length; c_isbn++) {
    isbn_str = ret[c_isbn].isbn.toString();
    if (req.body[isbn_str] == "on") {
      del_list.push(isbn_str);
    }
  }

  for (let d_isbn = 0; d_isbn < del_list.length; d_isbn++) {
    await r_book.findOneAndDelete({ isbn: del_list[d_isbn] });  
  }

  //사서리스트로 리다이렉트
  res.send(`<meta http-equiv="Refresh" content="0; url='/libr_list'"/>`);
});

// 검색
app.post('/search', async (req, res) => {
  await mongoose.connect('mongodb://127.0.0.1:27017/lib');
  // 제목, 작가, 페이지수, ISBN중 어떤걸로 검색할지를 입력받는다
  let s_categ = req.body["s_field"];
  let s_cont = req.body["s_cont"];
  console.log(s_cont);
  // 검색에서 비교할 값을 입력 받아서 모든 책의 해당 값를 입력값이랑 비교해준다

  let query = {};
  query[s_categ] = s_cont;

  let books = await r_book.find(query);
  // 일치되는 책들을 모두 리스트에다가 출력해준다
  books.sort(alpha_order);  

  res.render('test_libr_search', {books});
  // 검색 전의 리스트로 돌려주는 입력을 받으면 리스트로 리다이렉트 
});

app.listen(PORT, function(err){
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});