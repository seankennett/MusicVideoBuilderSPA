import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  faqs: {question:string, answer:string}[] = [
    {question: 'question 1', answer:'answer 1'},
    {question: 'question 2', answer:'answer 2'},
    {question: 'question 3', answer:'answer 3'},
    {question: 'question 4', answer:'answer 4'},
    {question: 'question 5', answer:'answer 5'}
  ]

}
